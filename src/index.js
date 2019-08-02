import { Application } from "pixi.js";
import * as PIXI from "pixi.js";
import Svg from "./svg";
import { Viewport } from "pixi-viewport";

//import Svg2 from "pixi-vector-graphics";

const app = new Application({
	width: window.innerWidth,
	height: window.innerHeight,
	backgroundColor: 0xffffff,
	antialias: true
});

const c = document.querySelector("#app");
app.stage = new Viewport()
	.drag()
	.pinch()
	.wheel();

app.loader.baseUrl = "./data";
app.loader.add("svg", "map2.svg.txt", { crossOrigin: true }).load(() => {
	const t = app.loader.resources["svg"].data;
	const container = document.createElement("div");
	container.innerHTML = t;
	//    container.style.display = "inline-block";
	const svgE = container.children[0];

	//c.appendChild(container);

	const svgG = new Svg(svgE, { unpackTree: true, fillColor: 0x00ff00 });

	console.log(svgG);
	let objs = [...svgG.children];
	let index = 0;

	while (objs[++index]) {
		let e = objs[index];
		if (e.type !== "g") {
			e.interactive = true;
			e.buttonMode = true;
			e.on("pointerover", onHoverUp, this);
			e.on("pointerout", onHowerDown, this);
		} else {
			objs.push(...e.children);
		}
	}

	app.stage.addChild(svgG);
});

let _last = undefined;
function onHoverUp(event) {
	
	if (_last) {
		_last.tint = 0xffffff;
	}
	setTimeout(() => {
		event.target.tint = 0xff0000;
		_last = event.target;
	}, 0);
}

function onHowerDown(event) {
	if (_last) _last.tint = 0xffffff;
	_last = undefined;
}

c.appendChild(app.view);
