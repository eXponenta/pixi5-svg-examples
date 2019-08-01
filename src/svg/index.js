import dPathParse from "d-path-parser";
import * as PIXI from "pixi.js";
import tcolor from "tinycolor2";
import { parseScientific, splitAttributeParams, arcToBezier, parseTransform} from "./utils";


//Ток Ваня мог так накосячить, что нужно это
//@see https://github.com/pixijs/pixi.js/pull/5981
//@ts-ignore

const _oldClone = PIXI.FillStyle.prototype.clone;
const _oldReset = PIXI.FillStyle.prototype.reset;

PIXI.FillStyle.prototype.clone = function() {
	const style = _oldClone.call(this);
	style.native = false;
	return style;
}

PIXI.FillStyle.prototype.reset = function() {
	_oldReset.call(this);
	//@ts-ignore
	this.native = false;
}


/**
 * Scalable Graphics drawn from SVG image document.
 * @class SVG
 * @extends PIXI.Graphics
 * @memberof PIXI
 * @param {SVGSVGElement} svg - SVG Element `<svg>`
 */
export default class SVG extends PIXI.Graphics {
	/**
	 * Constructor
	 */
	constructor(svg, unpackTree) {
		super();
		this.upacked = unpackTree;
		//this.fillShapes(svg);
		this.svgChildren(svg.children);
	}

	/**
	 * Parse transform attribute
	 * @private
	 * @method PIXI.SVG#parseTransform
	 * @param {SVGCircleElement} node
	 */
	svgTransform(node) {
		if (!node.getAttribute("transform")) return undefined;

		const matrix = new PIXI.Matrix();
		const transformAttr = node
			.getAttribute("transform");

		const commands = parseTransform(transformAttr);

		//apply transform matrix right to left
		for(let key = commands.length - 1; key >= 0; -- key) {
			
			let command = commands[ key ].command;
			let values = commands[ key ].params;

			if (command === "matrix") {
				matrix.a = parseScientific(values[0]);
				matrix.b = parseScientific(values[1]);
				matrix.c = parseScientific(values[2]);
				matrix.d = parseScientific(values[3]);
				matrix.tx = parseScientific(values[4]);
				matrix.ty = parseScientific(values[5]);

				return matrix;
				//graphics.transform.localTransform = transformMatrix;
			} else if (command === "translate") {
				const dx = parseScientific(values[0]);
				const dy = parseScientific(values[1]) || 0;
				matrix.translate(dx, dy);

			} else if (command === "scale") {
				const sx = parseScientific(values[0]);
				const sy = values.length > 1 ? parseScientific(values[1]) : sx;
				matrix.scale(sx, sy);

			} else if (command === "rotate") {
				
				let dx = 0;
				let dy = 0;

				if (values.length > 1) {
					dx = parseScientific(values[1]);
					dy = parseScientific(values[2]);
				}

				matrix
					.translate(-dx, -dy)
					.rotate(parseScientific(values[0]) * Math.PI / 180)
					.translate(dx, dy);
			}
		}

		console.log(matrix);
		return matrix;
	}

	/**
	 * Create a PIXI Graphic from SVG element
	 * @private
	 * @method PIXI.SVG#svgChildren
	 * @param {Array<*>} children - Collection of SVG nodes
	 * @param {*} [parentStyle=undefined] Whether to inherit fill settings.
	 * @param {PIXI.Matrix} [parentMatrix=undefined] Matrix fro transformations
	 */
	svgChildren(children, parentStyle, parentMatrix) {
		for (let i = 0; i < children.length; i++) {
			const child = children[i];

			const shape = this.upacked ? new SVG(child, this.upacked) : this;
			const nodeName = child.nodeName.toLowerCase();
			const nodeStyle = this.svgStyle(child);
			const matrix = this.svgTransform(child);

			/**
			 * @type {PIXI.Matrix}
			 */
			/*
			let fullMatrix;
			if(matrix) {
				fullMatrix = matrix;
				if(parentMatrix) {
				fullMatrix.
				}
			}*/
			//compile full style inherited from all parents
			const fullStyle = Object.assign({}, parentStyle || {}, nodeStyle);

			shape.fillShapes(child, fullStyle);
			switch (nodeName) {
				case "path": {
					//console.log(child.getAttribute("id"), {...fullStyle});
					shape.svgPath(child);
					break;
				}
				case "circle":
				case "ellipse": {
					shape.svgCircle(child);
					break;
				}
				case "rect": {
					shape.svgRect(child);
					break;
				}
				case "polygon": {
					shape.svgPoly(child, true);
					break;
				}
				case "polyline": {
					shape.svgPoly(child, false);
					break;
				}
				case "g": {
					break;
				}
				default: {
					// @if DEBUG
					console.info("[SVGUtils] <%s> elements unsupported", child.nodeName);
					// @endif
					break;
				}
			}
			shape.svgChildren(child.children, fullStyle, matrix);
			if (this.upacked) {
				this.addChild(shape);
			}
		}
	}

	/**
	 * Convert the Hexidecimal string (e.g., "#fff") to uint
	 * @private
	 * @method PIXI.SVG#hexToUint
	 */
	hexToUint(hex) {
		if (hex === undefined || hex === null) return;

		if (hex[0] === "#") {
			// Remove the hash
			hex = hex.substr(1);

			// Convert shortcolors fc9 to ffcc99
			if (hex.length === 3) {
				hex = hex.replace(/([a-f0-9])/gi, "$1$1");
			}
			return parseInt(hex, 16);
		} else {
			const rgb = tcolor(hex).toRgb();

			return (rgb.r << 16) + (rgb.g << 8) + rgb.b;
		}
	}

	/**
	 * Render a <ellipse> element or <circle> element
	 * @private
	 * @method PIXI.SVG#internalEllipse
	 * @param {SVGCircleElement} node
	 */
	svgCircle(node) {
		let heightProp = "r";
		let widthProp = "r";
		const isEllipse = node.nodeName === "ellipse";
		if (isEllipse) {
			heightProp += "x";
			widthProp += "y";
		}
		const width = parseFloat(node.getAttribute(widthProp));
		const height = parseFloat(node.getAttribute(heightProp));
		const cx = node.getAttribute("cx") || 0;
		const cy = node.getAttribute("cy") || 0;
		let x = 0;
		let y = 0;
		if (cx !== null) {
			x = parseFloat(cx);
		}
		if (cy !== null) {
			y = parseFloat(cy);
		}
		if (!isEllipse) {
			this.drawCircle(x, y, width);
		} else {
			this.drawEllipse(x, y, width, height);
		}
	}

	/**
	 * Render a <rect> element
	 * @private
	 * @method PIXI.SVG#svgRect
	 * @param {SVGRectElement} node
	 */
	svgRect(node) {
		const x = parseFloat(node.getAttribute("x")) || 0;
		const y = parseFloat(node.getAttribute("y")) || 0;
		const width = parseFloat(node.getAttribute("width"));
		const height = parseFloat(node.getAttribute("height"));
		const rx = parseFloat(node.getAttribute("rx"));
		if (rx) {
			this.drawRoundedRect(x, y, width, height, rx);
		} else {
			this.drawRect(x, y, width, height);
		}
	}

	/**
	 * Get the style property and parse options.
	 * @private
	 * @method PIXI.SVG#svgStyle
	 * @param {SVGElement} node
	 * @return {Object} Style attributes
	 */
	svgStyle(node) {
		const style = node.getAttribute("style");
		const result = {
			fill: node.getAttribute("fill"),
			opacity: node.getAttribute("opacity"),
			fillOpacity: node.getAttribute("fill-opacity"),
			stroke: node.getAttribute("stroke"),
			strokeOpacity : node.getAttribute("stroke-opacity"),
			strokeWidth: node.getAttribute("stroke-width")
		};
		if (style !== null) {
			style.split(";").forEach(prop => {
				const [name, value] = prop.split(":");
				result[name.trim()] = value.trim();
			});
			if (result["stroke-width"]) {
				result.strokeWidth = result["stroke-width"];
				delete result["stroke-width"];
			}
		}

		for (let key in result) {
			if (result[key] === null) {
				delete result[key];
			}
		}
		/*
	if(!result.stroke || !result.fill) {
	  const computed =  window.getComputedStyle(node);
	  //console.log(computed);
	  result.stroke = computed.getPropertyValue("stroke");
	  result.fill = computed.getPropertyValue("fill");
	  if(!result.stroke)
		result.stroke = null;
	  if(!result.fill)
		result.fill = null;
	  
	  console.log(result);
	}*/
		return result;
	}

	/**
	 * Render a polyline element.
	 * @private
	 * @method PIXI.SVG#svgPoly
	 * @param {SVGPolylineElement} node
	 */
	svgPoly(node, close) {
		const points = node
			.getAttribute("points")
			.split(/[ ,]/g)
			.map(p => parseFloat(p));

		this.drawPolygon(points);

		if (close) {
			this.closePath();
		}
	}

	/**
	 * Set the fill and stroke style.
	 * @private
	 * @method PIXI.SVG#fillShapes
	 * @param {SVGElement} node
	 * @param {} style
	 */
	fillShapes(node, style) {
		const { fill, opacity, stroke, strokeWidth, strokeOpacity, fillOpacity } = style;
		const defaultLineWidth = stroke !== undefined ? 1 : 0;
		const lineWidth = strokeWidth !== undefined ? Math.max(.5, parseFloat(strokeWidth)) : defaultLineWidth;
		const lineColor = stroke !== undefined ? this.hexToUint(stroke) : this.lineColor;
		
		const strokeOpacityValue = 
			(opacity !== undefined) ? parseFloat(opacity) : (fillOpacity !== undefined ? parseFloat(strokeOpacity) : 1);
		
		const fillOpacityValue = 
			(opacity !== undefined) ? parseFloat(opacity) : (strokeOpacity !== undefined ? parseFloat(fillOpacity) : 1);
		

		const matrix = this.svgTransform(node);

		if (fill) {
			if (fill === "none" || fill === "transparent") {
				this.beginFill(0, 0);
			} else {
				this.beginFill(this.hexToUint(fill), fillOpacityValue);
			}
		} else {
			this.beginFill(0, 1);
		}

		this.lineStyle(lineWidth, lineColor, strokeOpacityValue);
		this.setMatrix(matrix);
	

		// @if DEBUG
		if (node.getAttribute("stroke-linejoin")) {
			console.info('[SVGUtils] "stroke-linejoin" attribute is not supported');
		}
		if (node.getAttribute("stroke-linecap")) {
			console.info('[SVGUtils] "stroke-linecap" attribute is not supported');
		}
		if (node.getAttribute("fill-rule")) {
			console.info('[SVGUtils] "fill-rule" attribute is not supported');
		}
		// @endif
	}

	/**
	 * Render a <path> d element
	 * @method PIXI.SVG#svgPath
	 * @param {SVGPathElement} node
	 */
	svgPath(node) {
		const d = node.getAttribute("d");
		let x = 0,
			y = 0;
		const commands = dPathParse(d);
		let prevCommand = undefined;

		for (var i = 0; i < commands.length; i++) {
			const command = commands[i];
			//console.log(command.code, command);

			switch (command.code) {
				case "m": {
					this.moveTo((x += command.end.x), (y += command.end.y));
					break;
				}
				case "M": {
					this.moveTo((x = command.end.x), (y = command.end.y));
					break;
				}
				case "H": {
					this.lineTo((x = command.value), y);
					break;
				}
				case "h": {
					this.lineTo((x += command.value), y);
					break;
				}
				case "V": {
					this.lineTo(x, (y = command.value));
					break;
				}
				case "v": {
					this.lineTo(x, (y += command.value));
					break;
				}
				case "Z":
				case "z": {
					//jump corete to end
					if(prevCommand && prevCommand.end){
						this.moveTo(prevCommand.end.x, prevCommand.end.y);
					}
					this.closePath();
					break;
				}
				case "L": {
					this.lineTo((x = command.end.x), (y = command.end.y));
					break;
				}
				case "l": {
					this.lineTo((x += command.end.x), (y += command.end.y));
					break;
				}

				//short C, selet cp1 from last command
				case "S": {
					let cp1 = { x, y };
					let cp2 = command.cp;
					//S is compute points from old points
					if (prevCommand.code == "S" || prevCommand.code == "C") {
						const lc = prevCommand.cp2 || prevCommand.cp;
						cp1.x = 2 * prevCommand.end.x - lc.x;
						cp1.y = 2 * prevCommand.end.y - lc.y;
					} else {
						cp1 = cp2;
					}

					this.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (x = command.end.x), (y = command.end.y));
					break;
				}
				case "C": {
					const cp1 = command.cp1;
					const cp2 = command.cp2;

					this.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, (x = command.end.x), (y = command.end.y));
					break;
				}
				//diff!!
				//short C, select cp1 from last command
				case "s": {
					const currX = x;
					const currY = y;

					let cp1 = { x, y };
					let cp2 = command.cp;

					console.log("p", prevCommand);
					//S is compute points from old points
					if (prevCommand.code == "s" || prevCommand.code == "c") {
						const lc = prevCommand.cp2 || prevCommand.cp;
						cp1.x = prevCommand.end.x - lc.x;
						cp1.y = prevCommand.end.y - lc.y;
					} else {
						this.quadraticCurveTo(currX + cp2.x, currY + cp2.y, (x += command.end.x), (y += command.end.y));
						break;
					}

					this.bezierCurveTo(
						currX + cp1.x,
						currY + cp1.y,
						currX + cp2.x,
						currY + cp2.y,
						(x += command.end.x),
						(y += command.end.y)
					);
					break;
				}
				case "c": {
					const currX = x;
					const currY = y;
					const cp1 = command.cp1;
					const cp2 = command.cp2;

					this.bezierCurveTo(
						currX + cp1.x,
						currY + cp1.y,
						currX + cp2.x,
						currY + cp2.y,
						(x += command.end.x),
						(y += command.end.y)
					);
					break;
				}
				case "t": {
					let cp = command.cp || { x, y };
					let prevCp = { x, y };

					if (prevCommand.code != "t" || prevCommand.code != "q") {
						prevCp = prevCommand.cp || prevCommand.cp2 || prevCommand.end;
						cp.x = prevCommand.end.x - prevCp.x;
						cp.y = prevCommand.end.y - prevCp.y;
					} else {
						this.lineTo((x += command.end.x), (y += command.end.y));
						break;
					}

					const currX = x;
					const currY = y;
					this.quadraticCurveTo(currX + cp.x, currY + cp.y, (x += command.end.x), (y += command.end.y));
					break;
				}
				case "q": {
					const currX = x;
					const currY = y;
					this.quadraticCurveTo(
						currX + command.cp.x,
						currY + command.cp.y,
						(x += command.end.x),
						(y += command.end.y)
					);
					break;
				}

				case "T": {
					let cp = command.cp || { x, y };
					let prevCp = { x, y };
					if (prevCommand.code != "T" || prevCommand.code != "Q") {
						prevCp = prevCommand.cp || prevCommand.cp2 || prevCommand.end;
						cp.x = 2 * prevCommand.end.x - prevCp.x;
						cp.y = 2 * prevCommand.end.y - prevCp.y;
					} else {
						this.lineTo((x = command.end.x), (y = command.end.y));
						break;
					}

					this.quadraticCurveTo(cp.x, cp.y, (x = command.end.x), (y = command.end.y));
					break;
				}

				case "Q": {
					let cp = command.cp;
					this.quadraticCurveTo(cp.x, cp.y, (x = command.end.x), (y = command.end.y));
					break;
				}

				//arc as bezier
				case "a":
				case "A": {
					const currX = x;
					const currY = y;
					if (command.relative) {
						x += command.end.x;
						y += command.end.y;
					} else {
						x = command.end.x;
						y = command.end.y;
					}
					const beziers = arcToBezier({
						x1: currX,
						y1: currY,
						rx: command.radii.x,
						ry: command.radii.y,
						x2: x,
						y2: y,
						phi: command.rotation,
						fa: command.large,
						fs: command.clockwise
					});
					for (let b of beziers) {
						this.bezierCurveTo(b[2], b[3], b[4], b[5], b[6], b[7]);
					}
					//console.log(command);
					break;
				}
				default: {
					console.info("[SVGUtils] Draw command not supported:", command.code, command);
				}
			}

			//save previous command fro C S and Q
			prevCommand = command;
		}
	}
}
