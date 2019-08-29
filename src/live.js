import { Application, Sprite, Texture, GraphicsGeometry } from "pixi.js";
import  Svg  from "pixi5-svg";
import { Viewport } from "pixi-viewport";


GraphicsGeometry.BATCHABLE_SIZE = Infinity;

const tests = {
	bee: "Complex test: bee"
};

const app = new Application({
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0xcccccc,
	antialias: true
});

const c = document.querySelector("#app");
const v = new Viewport()
	.drag()
	.pinch()
	.wheel();

app.stage.addChild(v);

const data = Object.keys(tests).map(e => ({ key: e, url: e + ".svg.txt" }));
app.loader.baseUrl = "./data";
app.loader.add(data).load(() => {
	const res = app.loader.resources;
	const pw = app.screen.width;
	const ph = app.screen.height;
	const offset = 40;
	const fileReader = new FileReader();
	const input = document.querySelector("#file-input");
	const toogleUnpack = document.querySelector("#toogle-unpack");
	const tooglePallete = document.querySelector("#toogle-pallete");
	const ptime = document.querySelector("#parsing-time");
	const pchildrens = document.querySelector("#childrens");
	
	let lastFileResult = undefined;
	let pallete;

	toogleUnpack.addEventListener("change", (_)=>{
		if(!lastFileResult) return;
		createAndFit(lastFileResult);
	});

	tooglePallete.addEventListener("change", (_)=>{
		if(!lastFileResult) return;
		createAndFit(lastFileResult);
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

	function createAndFit(svgText) {
		const start = performance.now();
		const svg = window.svg =  new Svg(svgText, {unpackTree : toogleUnpack.checked, pallete : tooglePallete.checked, use32Indexes : true});
		const delta = performance.now() - start;
		
		ptime.textContent = delta.toFixed(2) + "ms";

		let count = 1;
		const counter = (node)=>{
			count += node.children.length;
			node.children.forEach((e)=> counter(e))
		};

		counter(svg);
		pchildrens.textContent = "" + count;
		console.log("Parsed svg", svg);
		const bounds = svg.getBounds();

		v.removeChild(...v.children);
		if(pallete){
			pallete.destroy();
			pallete = undefined;
		}

		const scale = Math.min((pw - offset * 2) / bounds.width, (ph - 80 - offset * 2) / bounds.height);
		svg.scale.set(scale);
		svg.pivot.set(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
		svg.position.set(pw * 0.5, (ph - 80) * 0.5);
		v.scale.set(1);
		v.position.set(1, 1);
		v.addChild(svg);

		if(svg.pallete) {
			pallete = new Sprite(new Texture(svg.pallete.texture));
			
			pallete.scale.set(4);
			
			app.stage.addChild(pallete);
		}
	}

	data.forEach((e, index) => {
		const text = res[e.key].data;
		lastFileResult = text;
		createAndFit(text);
	});
});

c.appendChild(app.view);