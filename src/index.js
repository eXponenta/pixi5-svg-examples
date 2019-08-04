import { Application, Container, Graphics, Text } from "pixi.js";
import Svg from "pixi5-svg";
import { Viewport } from "pixi-viewport";

const tests = {
	"a-test": "Test arc",
	"shape-test": "Shapes test\n(miter bug)",
	"rotate-test": "Rotate and translate test!\n(bounds bug)",
	"rs-test": "Short bezier (C) test",
	"s-test": "Bezier (s) test",
	"t-test": "Bezier (Q, T) test\n(selfcrossing bug)",
	bee: "Complex test: bee",
	tiger: "Complex test: tiger"
};

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

const data = Object.keys(tests).map(e => ({ key: e, url: e + ".svg.txt" }));
app.loader.baseUrl = "./data";
app.loader.add(data).load(() => {
	const res = app.loader.resources;
	const pw = app.screen.width / 4;
	const ph = app.screen.height / 2;
	const offset = 40;
	const stroke = new Graphics().lineStyle(2, 0x0);
	const textContainer = new Container();
	const svgContainer = new Container();

	data.forEach((e, index) => {
		const text = res[e.key].data;
		const svg = new Svg(text,{ unpackTree : true });

		const x = pw * (index % 4),
			y = 80 + ((index / 4) | 0) * ph;

		const bounds = svg.getBounds();

		const title = new Text(tests[e.key]);
		const scale = Math.min((pw - offset * 2) / bounds.width, (ph - 80 - offset * 2) / bounds.height);

		title.position.set(x, y - 10);
		title.anchor.set(0, 1);

		svg.scale.set(scale);
		svg.pivot.set(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);
		svg.position.set(x + pw * 0.5, y + (ph - 80) * 0.5);

		svgContainer.addChild(svg);
		textContainer.addChild(title);
		stroke.drawRect(x, y, pw, ph - 80);
	});

	app.stage.addChild(stroke, svgContainer, textContainer);
});
c.appendChild(app.view);
