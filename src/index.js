import { Application, GraphicsGeometry } from "pixi.js";
import Svg from "./svg";
import { Viewport } from "pixi-viewport";

import * as PIXI from "pixi.js";
window.PIXI = PIXI;

//GraphicsGeometry.BATCHABLE_SIZE = 100000;

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
app.loader
	//.add("svg", "map2.svg.txt")
	.add("tiger", "m-test.svg.txt")
	.load(() => {

	//const map = app.loader.resources["svg"].data;
	const tiger = app.loader.resources["tiger"].data;
	//c.appendChild(container);

	//const svgMapObject = new Svg(svgMap, { unpackTree: false});
	const svgTigerObject = new Svg(tiger, { unpackTree: false, fillColor: "red"});
	
/*
	console.log(svgMapObject);
	let objs = [...svgMapObject.children];
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
	*/
	app.stage.addChild(svgTigerObject)//, svgMapObject, );
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
