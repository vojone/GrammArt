class GlobalSettings {
  static ARG_ORDER = ["w", "h", "bg", "bga"]

  static ARGS = {
    "w" : acceptNumber,
    "h" : acceptNumber,
    "bg" : acceptRGBString,
    "bga" : acceptNumberZeroToOne,
  }

  constructor(w, h, background, alpha) {
    this.w = w;
    this.h = h;
    this.background = background;
    this.alpha = alpha;
  }
}

class MSymbol {
  static ARG_ORDER = []

  static ARGS = {}

  constructor() {}

  hasArg(name) {
    return Object.hasOwn(this.ARGS, name);
  }
}

class NonTerminal extends MSymbol {
  static ARG_ORDER = ["x", "y", "s", "r", "c", "a", "cc", "ca"]

  static ARGS = {
    "x" : acceptNumber,
    "y" : acceptNumber,
    "s" : acceptPositiveNumberOrZero,
    "r" : acceptNumber,
    "c" : acceptRGBString,
    "a" : acceptNumberZeroToOne,
    "cc" : acceptRGBDiffString,
    "ca" : acceptNumber,
  }

  constructor(id, cx = 0, cy = 0, csize = 1, r = 0, color = null, alpha = null, ccolor = [0, 0, 0], calpha = 0) {
    super();
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.csize = csize;
    this.r = r;
    this.color = color;
    this.alpha = alpha;
    this.ccolor = ccolor;
    this.calpha = calpha;
  }
}


class Terminal extends MSymbol {
  static ARG_ORDER = ["x", "y", "s", "c", "r", "a"]

  static ARGS = {
    "x" : acceptNumber,
    "y" : acceptNumber,
    "s" : acceptPositiveNumberOrZero,
    "c" : acceptRGBString,
    "r" : acceptNumber,
    "a" : acceptNumberZeroToOne,
  }

  constructor(x, y, size, color, r, alpha) {
    super();
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.r = r;
    this.alpha = alpha;
  }
}


class Square extends Terminal {
  static ARG_ORDER = [...Terminal.ARG_ORDER]

  static ARGS = Object.assign({}, Terminal.ARGS)

  constructor(x = 0, y = 0, size = 1, color = null, r = 0, alpha = null) {
    super(x, y, size, color, r, alpha);
  }
}


class Circle extends Terminal {
  static ARG_ORDER = [...Terminal.ARG_ORDER]

  static ARGS = Object.assign({}, Terminal.ARGS)

  constructor(x = 0, y = 0, size = 1, color = null, r = 0, alpha = null) {
    super(x, y, size, color, r, alpha);
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
  constructor(rules = {}, entryPoint = null, settings = {}) {
    this.rules = rules;
    this.rulesAreNormalized = false;
    this.entryPoint = entryPoint;
    this.settings = settings;
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
  constructor(x, y, size, color, r, alpha) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
    this.r = r;
    this.alpha = alpha;
  }
}


class SymbolCtx extends InitialCtx {
  constructor(rule, x = 0, y = 0, size = 1, color = [0, 0, 0], r = 0, alpha = 1) {
    super(x, y, size, color, r, alpha);
    this.rule = rule;
  }
}


class Interpreter {
  SPF = 5; // Steps per frame

  constructor(initialCtx, canvasElement, defaultSettings = {w: 500, h: 600, background: [255, 255, 255], alpha: 1}) {
    this.initialCtx = initialCtx;
    this.contextsQueue = [];
    this.history = [];
    this.grammar = null;
    this.canvasElement = canvasElement[0];
    this.canvasElementCtx = canvasElement[0].getContext("2d");
    this.isRunning = false;
    this.defaultSettings = defaultSettings;
    if(this.canvasElementCtx === null) {
      throw new Error("Unable to get context of canvas!");
    }
  }

  _colorSum(c1, c2) {
    let result = [];
    for (let index = 0; index < c1.length; index++) {
      result.push(clipSum(c1[index], c2[index], 0, 255));
    }

    return result;
  }

  _alphaSum(a1, a2) {
    return clipSum(a1, a2, 0, 1);
  }

  static _canvasFill(canvasCtx, w, h, background, alpha) {
    canvasCtx.fillStyle = background;
    canvasCtx.globalAlpha = alpha;
    canvasCtx.fillRect(0, 0, w, h);
  }

  static _circle(canvasCtx, x, y, size, color, alpha) {
    canvasCtx.fillStyle = channelsToRGB(color);
    canvasCtx.globalAlpha = alpha;
    canvasCtx.beginPath();
    canvasCtx.arc(x, y, size * 0.5, 0, 2 * Math.PI);
    canvasCtx.fill();
  }

  static _square(canvasCtx, x, y, cornerX, cornerY, size, rads, color, alpha) {
    canvasCtx.save();

    canvasCtx.translate(cornerX, cornerY);
    canvasCtx.rotate(rads);
    canvasCtx.translate(-cornerX, -cornerY);

    canvasCtx.fillStyle = channelsToRGB(color);
    canvasCtx.globalAlpha = alpha;
    canvasCtx.fillRect(x, y, size, size);

    canvasCtx.restore();
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

  isFinished() {
    return this.contextsQueue.length == 0;
  }

  hasGrammar() {
    return this.grammar !== null;
  }

  setGrammar(grammar) {
    this.grammar = grammar;
  }

  run() {
    this.isRunning = true;

    if(!this.isFinished()) {
      requestAnimationFrame(() => {
        this.makeStepUntilEnd();
      });
    }
  }

  reset() {
    this.isRunning = false;
    this.contextsQueue = [];
  }

  init() {
    this.grammar.normalizeRules();

    this.setupCanvas();

    let centeredInitialCtx = Object.assign(
      Object.fromEntries(Object.entries(this.initialCtx)), // Deep copy of initial context
      {
        x: this.canvasElement.width * 0.5 + this.initialCtx.x,
        y: this.canvasElement.height * 0.5 + this.initialCtx.y,
      },
    );

    const initialRule = this.grammar.pickNext(this.grammar.entryPoint);
    let ctx = Object.assign(new SymbolCtx(initialRule), centeredInitialCtx);
    this.contextsQueue.push(ctx);
  }

  setupCanvas() {
    let defaultSettings = this.defaultSettings;
    let grammarSettings = this.grammar.settings;

    function defaultIfNotDefined(settingName) {
      if(Object.hasOwn(grammarSettings, settingName) &&
        grammarSettings[settingName] !== undefined) {
        return grammarSettings[settingName];
      }
      else {
        return defaultSettings[settingName];
      }
    }

    this.canvasElement.width = defaultIfNotDefined("w");
    this.canvasElement.height = defaultIfNotDefined("h");
    let bg = channelsToRGB(defaultIfNotDefined("background"));
    let alpha = defaultIfNotDefined("alpha");

    Interpreter._canvasFill(
      this.canvasElementCtx,
      this.canvasElement.width,
      this.canvasElement.height,
      bg,
      alpha
    );
    this.history.push([Interpreter._canvasFill, [this.canvasElement.width, this.canvasElement.height, bg, alpha]]);
  }

  step() {
    this.isRunning = false;

    if(!this.isFinished()) {
      requestAnimationFrame(() => {
        this.makeStep();
      });
    }
  }

  stop() {
    this.isRunning = false;
  }

  makeStepUntilEnd(_time) {
    let finished = false;
    //console.log(this.SPF);
    for (let i = 0; i < this.SPF && !finished; i++) {
      finished &= this.makeStep();
    }
    if(!finished && this.isRunning) {
      requestAnimationFrame(() => {
        this.makeStepUntilEnd();
      });
    }
  }

  makeStep() {
    if(this.isFinished()) {
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
          const color = child.color !== null ? child.color : (this._colorSum(currentCtx.color, child.ccolor));
          const alpha = child.alpha !== null ? child.alpha : (this._alphaSum(currentCtx.alpha, child.calpha));
          let newCtx = new SymbolCtx(newRule, x, y, size, color, r, alpha);
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
    let cornerX = ctx.x + rotX * ctx.size;
    let cornerY = ctx.y + rotY * ctx.size;
    let x = cornerX - size * 0.5;
    let y = cornerY - size * 0.5;

    let color = squareObject.color !== null ? squareObject.color : ctx.color;
    let alpha = squareObject.alpha !== null ? squareObject.alpha : ctx.alpha;

    Interpreter._square(this.canvasElementCtx, x, y, cornerX, cornerY, size, rads, color, alpha);
    this.history.push([Interpreter._square, [x, y, cornerX, cornerY, size, rads, color, alpha]]);
  }

  drawCircle(ctx, squareObject) {
    let size = ctx.size * squareObject.size;

    let r = ctx.r + squareObject.r;
    let rads = Interpreter.deg2Rads(r);
    let [rotX, rotY] = Interpreter.rotateCoordinates(squareObject.x, squareObject.y, rads);
    let cornerX = ctx.x + rotX * ctx.size;
    let cornerY = ctx.y + rotY * ctx.size;
    let x = cornerX;
    let y = cornerY;

    let color = squareObject.color !== null ? squareObject.color : ctx.color;
    let alpha = squareObject.alpha !== null ? squareObject.alpha : ctx.alpha;

    Interpreter._circle(this.canvasElementCtx, x, y, size, color, alpha);
    this.history.push([Interpreter._circle, [x, y, size, color, alpha]]);
  }

  clear() {
    this.canvasElementCtx.clearRect(0, 0, this.canvasElement.width,  this.canvasElement.height);
    this.history = [];
  }
}
