class MSymbol {
  static ARG_ORDER = []

  static ARGS = {}

  constructor() {}

  hasArg(name) {
    return Object.hasOwn(this.ARGS, name);
  }
}

class NonTerminal extends MSymbol {
  static ARG_ORDER = ["x", "y", "s", "r"]

  static ARGS = {
    "x" : validateNumber,
    "y" : validateNumber,
    "s" : validateNumber,
    "r" : validateNumber,
  }

  constructor(id, cx = 0, cy = 0, csize = 1, r = 0) {
    super();
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.csize = csize;
    this.r = r;
  }
}


class Terminal extends MSymbol {
  static ARG_ORDER = ["x", "y"]

  static ARGS = {
    "x" : validateNumber,
    "y" : validateNumber,
  }

  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
  }
}


class Square extends Terminal {
  static ARG_ORDER = [...Terminal.ARG_ORDER, "s", "c", "r"]

  static ARGS = Object.assign(Terminal.ARGS, {
    "s" : validateNumber,
    "color" : acceptAllStrings,
    "r": validateNumber,
  })

  constructor(x = 0, y = 0, size = 1, color = "black", r = 0) {
    super(x, y);
    this.size = size;
    this.color = color;
    this.r = r
  }
}


class Circle extends Terminal {
  static ARG_ORDER = [...Terminal.ARG_ORDER, "s", "c", "r"]

  static ARGS = Object.assign(Terminal.ARGS, {
    "size" : validateNumber,
    "color" : acceptAllStrings,
    "r": validateNumber,
  })

  constructor(x = 0, y = 0, size = 1, color = "black", r = 0) {
    super(x, y);
    this.size = size;
    this.color = color;
    this.r = r;
  }
}



class Rule {
  constructor(name, descendants = [], weight = 1) {
    this.name = name;
    this.descendants = descendants;
    this.weight = weight;
    this.cweight = null;
  }

  pushDescendant(descendant) {
    this.descendants.push(descendant);
  }

  setCWeight(val) {
    this.cweight = val;
  }

  isEmpty() {
    return descendant.length == 0;
  }
}


class Grammar {
  constructor(rules = {}, entryPoint = null, options = {}) {
    this.rules = rules;
    this.rulesAreNormalized = false;
    this.entryPoint = entryPoint;
    this.options = options;
  }

  hasRule(name) {
    return Object.hasOwn(this.rules, name);
  }

  addNewRule(name, rule) {
    this.rulesAreNormalized = false;
    if(this.hasRule(name)) {
      this.rules[name].push(rule);
      return true;
    }
    else {
      this.rules[name] = Array(rule);
      return false;
    }
  }

  normalizeRules() {
    for (const [_name, ruleList] of Object.entries(this.rules)) {
      let totalWeight = ruleList.reduce((acc, ruleObj) => acc + ruleObj.weight, 0);
      ruleList.sort((r1, r2) => r2.weight - r1.weight );

      // Conversion to cummulative weight
      let cWeight = 0;
      for (let index = 0; index < ruleList.length; index++) {
        let ruleObj = ruleList[index];
        if (index + 1 == ruleList.length) {
          ruleObj.cweight = 1.0;
        }
        else {
          cWeight += ruleObj.weight;
          ruleObj.cweight = cWeight / totalWeight;
        }
      }
    };

    this.rulesAreNormalized = true;
  }

  pickNext(name) {
    if(!this.rulesAreNormalized) {
      throw new Error("Internal error! Rules have to be normalized!");
    }
    if(!this.hasRule(name)) {
      throw new Error(`Rule ${name} is not defined!`);
    }

    // Random roullete algorithm
    let r = Math.random();
    let selected = null;
    for (let index = 0; selected === null && index < this.rules[name].length; index++) {
      const rule = this.rules[name][index];
      selected = r <= rule.cweight ? rule : null;
    }

    // Because there may be problem with approximation errors -> pick the last one
    // if nothing was selected
    if(selected === null) {
      selected = this.rules[name][this.rules[name].length - 1];
    }

    return selected;
  }
}


class InitialCtx {
  constructor(x, y, size, color, r) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.r = r;
  }
}


class SymbolCtx extends InitialCtx {
  constructor(rule, x = 0, y = 0, size = 1, color = "black", r = 0) {
    super(x, y, size, color, r);
    this.rule = rule;
  }
}


class Interpreter {
  constructor(initialCtx, canvasElement) {
    this.initialCtx = initialCtx;
    this.contextsQueue = [];
    this.grammar = null;
    this.canvasElement = canvasElement[0];
    this.canvasElementCtx = canvasElement[0].getContext("2d");
    if(this.canvasElementCtx === null) {
      throw new Error("Unable to get context of canvas!");
    }
  }

  static deg2Rads(deg) {
    return (Math.PI / 180) * deg;
  }

  static rotateCoordinates(x, y, rad, origX = 0, origY = 0) {
    let tX = x - origX;
    let tY = y - origY;
    let rX = tX * Math.cos(rad) - tY * Math.sin(rad);
    let rY = tX * Math.sin(rad) + tY * Math.cos(rad);
    let fX = rX + origX;
    let fY = rY + origY;

    return [fX, fY];
}

  setGrammar(grammar) {
    this.grammar = grammar;
  }

  execute() {
    this.init();
    requestAnimationFrame(() => {this.makeStepUntilEnd();});
  }

  reset() {
    this.contextsQueue = [];
  }

  init() {
    this.grammar.normalizeRules();

    const initialRule = this.grammar.pickNext(this.grammar.entryPoint);
    let ctx = Object.assign(new SymbolCtx(initialRule), this.initialCtx);
    this.contextsQueue.push(ctx);
  }

  makeStepUntilEnd(_time) {
    let finished = this.makeStep();
    if(!finished) {
      requestAnimationFrame(() => {this.makeStepUntilEnd();});
    }
  }

  makeStep() {
    if(this.contextsQueue.length == 0) {
      return true;
    }

    const currentCtx = this.contextsQueue.shift();
    currentCtx.rule.descendants.forEach(child => {
      switch (child.constructor) {
        case NonTerminal:
          const newRule = this.grammar.pickNext(child.id);

          const r = currentCtx.r + child.r;
          let rads = Interpreter.deg2Rads(r);
          let [rotX, rotY] = Interpreter.rotateCoordinates(child.cx, child.cy, rads);
          const size = currentCtx.size * child.csize;
          const x = currentCtx.x + rotX * size;
          const y = currentCtx.y + rotY * size;
          const color = child.color;
          let newCtx = new SymbolCtx(newRule, x, y, size, color, r);
          this.contextsQueue.push(newCtx);
          break;

        case Square:
          this.drawSquare(currentCtx, child);
          break;

        case Circle:
          this.drawCircle(currentCtx, child);
          break;

        default:
          break;
      }
    });

    return false;
  }

  drawSquare(ctx, squareObject) {
    let size = ctx.size * squareObject.size;

    let r = ctx.r + squareObject.r;
    let rads = Interpreter.deg2Rads(r);
    let [rotX, rotY] = Interpreter.rotateCoordinates(squareObject.x, squareObject.y, rads);
    let cornerX = ctx.x + rotX * size;
    let cornerY = ctx.y + rotY * size;
    let x = cornerX - size * 0.5;
    let y = cornerY - size * 0.5;
    let color = squareObject.color;

    this.canvasElementCtx.save();

    this.canvasElementCtx.translate(cornerX, cornerY);
    this.canvasElementCtx.rotate(rads);
    this.canvasElementCtx.translate(-cornerX, -cornerY);

    this.canvasElementCtx.fillStyle = color;
    this.canvasElementCtx.fillRect(x, y, size, size);

    this.canvasElementCtx.restore();
  }

  drawCircle(ctx, squareObject) {
    let size = ctx.size * squareObject.size;

    let r = ctx.r + squareObject.r;
    let rads = Interpreter.deg2Rads(r);
    let [rotX, rotY] = Interpreter.rotateCoordinates(squareObject.x, squareObject.y, rads);
    let cornerX = ctx.x + rotX * size;
    let cornerY = ctx.y + rotY * size;
    let x = cornerX;
    let y = cornerY;
    let color = squareObject.color;

    this.canvasElementCtx.fillStyle = color;
    this.canvasElementCtx.beginPath();
    this.canvasElementCtx.arc(x, y, size * 0.5, 0, 2 * Math.PI);
    this.canvasElementCtx.fill();
  }

  clear() {
    this.canvasElementCtx.clearRect(0, 0, this.canvasElement.width,  this.canvasElement.height);
  }
}
