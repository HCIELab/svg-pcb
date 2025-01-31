import { Turtle } from "./Turtle.js";

const length = ([x1, y1], [x2, y2]) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
const overlap = (p1, p2) => length(p1, p2) < 0.000001;

const via = (rv, rp) => {
  return {
    "F": {
      "pos": [0, 0],
      "shape": new Turtle().circle(rp).getPathData(),
      "layers": ["F.Cu"],
      "index": 1
    },
    "B": {
      "pos": [0, 0],
      "shape": new Turtle().circle(rp).getPathData(),
      "layers": ["B.Cu"],
      "index": 2
    },
    "drill": {
      "pos": [0, 0],
      "shape": new Turtle().circle(rv).getPathData(),
      "layers": ["drill"]
    }
  };
}

const wire = (pts, thickness) => {
  let lastPt = pts[0];
  let result = new Turtle();
  // result.booleanScale = 2000;
  result.goTo(lastPt, false);
  for (const pt of pts.slice(1)) {
    if (overlap(pt, lastPt)) continue;
    result.goTo(pt);
    lastPt = pt;
  }

  return result.offset(thickness/2);
}

const vector_add = ([x, y], [dx, dy]) => [x + dx, y + dy];
const dot = ([x0, y0], [x1, y1]) => x0*x1 + y0*y1;
const vector_rotate = ([x, y], angle) => [
  x*Math.cos(angle) - y * Math.sin(angle),
  y*Math.cos(angle) + x * Math.sin(angle)
]


class Component {
  constructor({ pads, layers }) {
    this.pads = pads;
    this.layers = layers;
  }

  pad(name) {
    return this.pads[name];
  }

  padX(name) {
    return this.pads[name][0];
  }

  padY(name) {
    return this.pads[name][1];
  }

  get pos() {
    return this.pads["center"]; // should store this somewhere else
  }

  get posX() {
    return this.pads["center"][0]; // should store this somewhere else
  }

  get posY() {
    return this.pads["center"][1]; // should store this somewhere else
  }
}

// let SWD_4_05 = {
//   "RST": {
//     "pos": [-0.072, -0.025],
//     "shape": "M 0 0 L 90 90",
//     "layers": ["F.Cu"]
//   },
//   "GND": {
//     "pos": [0.072, -0.025],
//     "shape": "M 0 0 L 90 90",
//     "layers": ["F.Cu"]
//   }
// }

function makeText(text, height, pos, rotate) {
  let lines = text.split('\n');
  let t = new Turtle();

  for (let [i, txt] of lines.entries()) {
    if (txt.length == 0) {
      continue;
    }
    let t2 = new Turtle().text(txt).scale(0.01*height).originate().translate([0, i*height*1.5]);
    t.group(t2);
  }

  // return t.originate().translate(pos);
  return t.originate().translate(pos).rotate(rotate, pos);
}

function makeComponent(comp, options = {}) {
  let translate = options.translate || [0, 0];
  let rotate = options.rotate || 0;
  let padLabelSize = options.padLabelSize || 0.02;
  // add flip

  const [xOff, yOff] = translate;
  const rad = (rotate * Math.PI) / 180;

  const pads = {}; // name: pos
  const padsLabels = [];
  let results = {};

  for (const pad in comp) {
    let { pos, shape, layers } = comp[pad];

    shape = typeof shape === "string" ? new Turtle().bezier(shape) : shape.copy();

    let pad_pos = vector_add(vector_rotate(pos, rad), translate);
    pads[pad] = pad_pos;

    shape.translate(pad_pos).rotate(rotate, pad_pos);

    if (!pad.includes("drill")) {
      let text = makeText(pad, padLabelSize, pad_pos, rotate);
      padsLabels.push( text );
    }

    layers.forEach(l => {
      if (l in results) results[l] = results[l].group(shape);
      else results[l] = shape;
    })
  }

  pads["center"] = translate;

  results.padLabels = padsLabels.reduce( (acc, cur) => acc.group(cur), new Turtle());

  return new Component({
    pads,
    layers: results
  })
}

export {
  wire,
  makeText,
  makeComponent,
  via
}
