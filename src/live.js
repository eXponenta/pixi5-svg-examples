
import { Application, Container, Graphics, Text } from "pixi.js";
import Svg from "pixi5-svg";
import { Viewport } from "pixi-viewport";

const tests = {
	"bee" : "Complex test: bee",
}

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

const data = Object.keys(tests).map((e) => ({key : e, url : e + ".svg.txt"}));
app.loader.baseUrl = "./data";
app.loader
	.add(data)
	.load(() => {

		const res = app.loader.resources;
		const pw = app.screen.width;
		const ph = 	app.screen.height;
        const offset = 40;
        const fileReader = new FileReader();
        const input = document.querySelector("#file-input");
        input.addEventListener("change", (e)=>{
            const files = e.target.files;
            const svg = files[0];

            fileReader.onloadend = (_)=>{
                createAndFit(fileReader.result);
            };
            fileReader.readAsText(svg);
        });
        function createAndFit(svgText){
            const svg = new Svg(svgText);
            console.log("Parsed svg", svg);
            const bounds = svg.getBounds();
            app.stage.removeChild(...app.stage.children);

			const scale = Math.min( (pw - offset * 2) / bounds.width, (ph - 80 - offset * 2) / bounds.height);
			svg.scale.set(scale);
			svg.pivot.set( bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5 );
            svg.position.set( pw * .5,  (ph-80) * .5);
            app.stage.scale.set(1);
            app.stage.position.set(1,1);
            //app.stage.resize(svg.width, svg.height);
            app.stage.addChild(svg);
        }

		data.forEach((e, index)=>{
            const text = res[e.key].data;
            createAndFit(text);
		});
	}
);

c.appendChild(app.view);
