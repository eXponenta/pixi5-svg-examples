
import Svg from "pixi5-svg";

const c = document.querySelector("#app");
const canvas = document.createElement("canvas");
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

fetch("./data/bee.svg.txt").then((r) => r.text()).then( (data) => {

	const pw = canvas.width;
	const ph = canvas.height;
	const offset = 40;
	const fileReader = new FileReader();
	const input = document.querySelector("#file-input");
	const toogle = document.querySelector("#toogle");
	const ptime = document.querySelector("#parsing-time");
	const pchildrens = document.querySelector("#childrens");
	
	let translate = {
		x:  0, y : 0
	}
	
	let scale = 1;
	let svgE = undefined;
	let lastFrame = undefined;

	let lastFileResult = undefined;

	toogle.addEventListener("change", (_)=>{
		lastFrame = undefined;
	});

	input.addEventListener("change", e => {
		const files = e.target.files;
		const svg = files[0];

		fileReader.onloadend = _ => {
			lastFileResult = fileReader.result;
			createAndFit(fileReader.result);
		};
		fileReader.readAsText(svg);
    });

	function render(cached = false) {
		
		ctx.setTransform(new DOMMatrix());

		ctx.fillStyle = "#aaaaaa";
		ctx.fillRect(0,0,canvas.width, canvas.height);
		
		if(!cached || !lastFrame){
			
			ctx.translate(translate.x , translate.y);
			ctx.scale(scale, scale);

			svgE.draw(ctx, true);

			if(!lastFrame) {
				const i =  new Image();
					i.src = canvas.toDataURL();
				lastFrame = {
					frame : i,
					translate: {...translate},
					scale: scale
				}
			}

		} else {

			let cx = translate.x - lastFrame.translate.x;
			let cy = translate.y - lastFrame.translate.y;
			let cs = scale / lastFrame.scale;
			let f = lastFrame.frame;
			
			ctx.translate(cx, cy);
			ctx.scale(cs, cs);
			ctx.drawImage(f, 0,0);
		}
	}

	function createAndFit(svgText) {
		const start = performance.now();
		svgE = window.svg = new Svg(svgText, {unpackTree : true});
		
		const delta = performance.now() - start;
		
		ptime.textContent = delta.toFixed(2) + "ms";

		let count = 1;
		const counter = (node)=>{
			count += node.children.length;
			node.children.forEach((e)=> counter(e))
		};

		counter(svgE);
		pchildrens.textContent = "" + count;
		console.log("Parsed svg", svgE);

		scale = 1 / Math.max(svgE.width / canvas.width, svgE.height / canvas.height);
		translate.x = 0.5 * (canvas.width - svgE.width * scale);
		translate.y = 0.5 * (canvas.height - svgE.height * scale);

		render();
	}

	
	createAndFit(data);

	canvas.addEventListener("pointermove", e =>{
		
		if(e.buttons !== 1) return;

		translate.x += e.movementX;
		translate.y += e.movementY;
		
		render(!toogle.checked);
	});

	document.addEventListener("wheel", e =>{
		
		const factor = 1 - 0.1 * e.deltaY / 220;
		scale *= factor;
		const dx = e.clientX;
		const dy = e.clientY;

		const ox = translate.x - dx;
		const oy = translate.y - dy;
		
		translate.x = ox * factor + dx;
		translate.y = oy * factor + dy;

		render(!toogle.checked);
	});
	
});

c.appendChild(canvas);