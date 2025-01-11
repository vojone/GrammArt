class MSymbol {
  static ARG_ORDER = []

  static ARGS = {}

  constructor() {}

  hasArg(name) {
    return Object.hasOwn(this.ARGS, name);
  }
}

class NonTerminal extends MSymbol {
  static ARG_ORDER = ["x", "y", "size"]

  static ARGS = {
    "x" : validateNumber,
    "y" : validateNumber,
    "size" : validateNumber,
  }

  constructor(id, cx = 0, cy = 0, csize = 1) {
    super();
    this.id = id;
    this.cx = cx;
    this.cy = cy;
    this.csize = csize;
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
  static ARG_ORDER = [...Terminal.ARG_ORDER, "size", "color"]

  static ARGS = Object.assign(Terminal.ARGS, {
    "size" : validateNumber,
    "color" : acceptAllStrings,
  })

  constructor(x = 0, y = 0, size = 1, color = "black") {
    super(x, y);
    this.size = size;
    this.color = color;
  }
}


class Circle extends Terminal {
  static ARG_ORDER = [...Terminal.ARG_ORDER, "size", "color"]

  static ARGS = Object.assign(Terminal.ARGS, {
    "size" : validateNumber,
    "color" : acceptAllStrings,
  })

  constructor(x = 0, y = 0, size = 1, color = "black") {
    super(x, y);
    this.size = size;
    this.color = color;
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
      this.rules.push(rule);
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
      ruleList.forEach(ruleObj => { ruleObj.weight /= totalWeight; });

      ruleList.sort((r1, r2) => r1.weight - r2.weight );

      // Conversion to cummulative weight
      let cWeight = 0;
      ruleList.forEach(ruleObj => {
        ruleObj.cweight = cWeight;
        cWeight += ruleObj.weight;
      });
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
    for (let index = 0; selected === null && index < this.rules[name]; index++) {
      const rule = this.rules[name][index];
      selected = rule.cweight > r ? rule : null;
    }

    // Because there may be problem with approximation errors -> pick the last one
    // if nothing was selected
    if(selected === null) {
      selected = this.rules[name][this.rules[name].length - 1];
    }

    return selected;
  }
}


class SymbolCtx {
  constructor(x, y, size, color, rule = null) {
    this.rule = rule;
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
  }
}


class Interpreter {
  constructor(initialCtx, canvasElement) {
    this.initialCtx = initialCtx;
    this.contextsQueue = [];
    this.grammar = null;
    this.canvasElement = canvasElement;
    this.canvasElementCtx = canvasElement[0].getContext("2d");
    if(this.canvasElementCtx === null) {
      throw new Error("Unable to get context of canvas!");
    }
  }

  setGrammar(grammar) {
    this.grammar = grammar;
  }

  execute() {
    this.init();
    requestAnimationFrame(() => {this.makeStepUntilEnd();});
  }

  init() {
    this.grammar.normalizeRules();

    const initialRule = this.grammar.pickNext(this.grammar.entryPoint);
    this.initialCtx.rule = initialRule;
    this.contextsQueue.push(this.initialCtx);
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
          const x = currentCtx.x + child.cx;
          const y = currentCtx.y + child.cy;
          const size = currentCtx.size * child.csize;
          const color = child.color;
          let newCtx = new SymbolCtx(x, y, size, color, newRule);
          this.contextsQueue.push(newCtx);
          break;

        case Square:
          this.drawSquare(currentCtx, child);
          break;

        default:
          break;
      }
    });

    return false;
  }

  drawSquare(ctx, squareObject) {
    let size = ctx.size * squareObject.size;
    let x = ctx.x + squareObject.x - size * 0.5;
    let y = ctx.y + squareObject.y - size * 0.5;
    let color = squareObject.color;

    this.canvasElementCtx.fillStyle = color;
    this.canvasElementCtx.fillRect(x, y, size, size);
  }
}
