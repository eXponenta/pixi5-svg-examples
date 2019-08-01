import dPathParse from "d-path-parser";
import * as PIXI from "pixi.js";
import tcolor from "tinycolor2";
import { parseScientific, splitAttributeParams, arcToBezier } from "./utils";

let _lastComputedStyle = undefined;
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

		var matrix = new PIXI.Matrix();
		var transformAttr = node
			.getAttribute("transform")
			.trim()
			.split("(");
		var transformCommand = transformAttr[0];
		var transformValues = transformAttr[1].replace(")", "");
		transformValues = splitAttributeParams(transformValues);

		if (transformCommand === "matrix") {
			matrix.a = parseScientific(transformValues[0]);
			matrix.b = parseScientific(transformValues[1]);
			matrix.c = parseScientific(transformValues[2]);
			matrix.d = parseScientific(transformValues[3]);
			matrix.tx = parseScientific(transformValues[4]);
			matrix.ty = parseScientific(transformValues[5]);
			//graphics.transform.localTransform = transformMatrix;
		} else if (transformCommand === "translate") {
			const dx = parseScientific(transformValues[0]);
			const dy = parseScientific(transformValues[1]);

			matrix.translate(dx, dy);
		} else if (transformCommand === "scale") {
			const sx = parseScientific(transformValues[0]);
			const sy = parseScientific(transformValues[1]);
			matrix.scale(sx, sy);
		} else if (transformCommand === "rotate") {
			console.log("Not implemented");
			/*if (transformValues.length > 1) {
		graphics.x += parseScientific(transformValues[1]);
		graphics.y += parseScientific(transformValues[2]);
		}

		graphics.rotation = parseScientific(transformValues[0]);

		if (transformValues.length > 1) {
		graphics.x -= parseScientific(transformValues[1]);
		graphics.y -= parseScientific(transformValues[2]);
		}*/
		}

		return matrix;
	}

	/**
	 * Create a PIXI Graphic from SVG element
	 * @private
	 * @method PIXI.SVG#svgChildren
	 * @param {Array<*>} children - Collection of SVG nodes
	 * @param {Boolean} [parentStyle=undefined] Whether to inherit fill settings.
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
					shape.svgPoly(child);
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
			shape.svgChildren(child.children, fullStyle);
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
			stroke: node.getAttribute("stroke"),
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
		const { fill, opacity, stroke, strokeWidth } = style;
		const defaultLineWidth = stroke !== undefined ? 1 : 0;
		const lineWidth = strokeWidth !== undefined ? Math.max(1, parseFloat(strokeWidth)) : defaultLineWidth;
		const lineColor = stroke !== undefined ? this.hexToUint(stroke) : this.lineColor;
		const opacityValue = opacity !== undefined ? parseFloat(opacity) : 1;
		const matrix = this.svgTransform(node);

		const rand = (Math.random() * 0xffffff) | 0;
		if (fill) {
			if (fill === "none") {
				this.beginFill(0, 0);
			} else {
				this.beginFill(this.hexToUint(fill), 1); //opacityValue);
			}
		} else {
			this.beginFill(0, 1);
		}

		this._fillStyle.visible = true;

		this.lineStyle(lineWidth, lineColor, opacityValue);

		if (matrix) {
			this.setMatrix(matrix);
		}

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

		for (var i = 0; i < commands.length; i++) 
		{
			const command = commands[i];
			console.log(command.code, command);

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
				case "S":
				case "C": {
					this.bezierCurveTo(
						command.cp1.x,
						command.cp1.y,
						command.cp2.x,
						command.cp2.y,
						(x = command.end.x),
						(y = command.end.y)
					);
					break;
				}
				case "s":
				case "c": {
					const currX = x;
					const currY = y;
					this.bezierCurveTo(
						currX + command.cp1.x,
						currY + command.cp1.y,
						currX + command.cp2.x,
						currY + command.cp2.y,
						(x += command.end.x),
						(y += command.end.y)
					);
					break;
				}
				case "t":
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
				case "T":
				case "Q": {
					const currX = x;
					const currY = y;
					let cpx = x;
					let cpy = y;


					//T is compute points from old points
					if (command.code === "T") {
						cpx = currX + (prevCommand.end.x - prevCommand.cp.x);
						cpy = currY + (prevCommand.end.y - prevCommand.cp.y);
					} else {
						cpx = command.cp.x;
						cpy = command.cp.y;
					}

					console.log(command.code, cpx, cpy);
					this.quadraticCurveTo(cpx, cpy, (x = command.end.x), (y = command.end.y));
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
					console.log(command);
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
