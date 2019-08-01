import { Application } from "pixi.js";
import * as PIXI from "pixi.js";
import Svg from "./svg"
import {Viewport} from "pixi-viewport";

//import Svg2 from "pixi-vector-graphics";

const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight / 2,
  backgroundColor: 0xffffff,
  antialias: true
});

const c = document.querySelector("#app");
app.stage = new Viewport().drag().pinch().wheel();

app.loader.baseUrl ="./data";
app.loader
  .add("svg","rotate-test.svg.txt", {crossOrigin : true})
  .load(()=>{
    const t = app.loader.resources["svg"].data;
    const container = document.createElement("div");
    container.innerHTML = t;
//    container.style.display = "inline-block";
    const svgE = container.children[0];
    
    c.appendChild(container);

    const svgG = new Svg(svgE);
    //const svgGG = new Svg2(svgE);
    //svgGG.scale.set(.75);
    //svgG.scale.set(5);
    
    //svgG.position.set(  150, 150);

    app.stage.addChild(svgG)//, svgGG);
    console.log(svgG);

    //app.render();
  });

c.appendChild(app.view);
