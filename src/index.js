import { Application } from "pixi.js";
import * as PIXI from "pixi.js";
import Svg from "./svg";
import Svg2 from "./Svg2";
import {Viewport} from "pixi-viewport";

//import Svg2 from "pixi-vector-graphics";

const app = new Application({
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: 0xffffff,
  resolution: window.devicePixelRatio,
  antialias: true
});

//app.stage = new Viewport().drag().pinch().wheel()
app.start();
//PIXI.GraphicsGeometry.BATCHABLE_SIZE = 1000000;

app.loader.baseUrl ="./data";
app.loader
  .add("svg","a-test.svg.txt", {crossOrigin : true})
  .load(()=>{
    const t = app.loader.resources["svg"].data;
    const container = document.createElement("div");
    container.innerHTML = t;
    const svgE = container.children[0];
    
    document.body.appendChild(container);

    const svgG = new Svg(svgE);
    //const svgGG = new Svg2(svgE);
    //svgGG.scale.set(.75);
    //svgG.scale.set(5);
    
    //svgG.position.set(  150, 150);

    app.stage.addChild(svgG)//, svgGG);
    console.log(svgG);

  });

document.body.appendChild(app.view);
