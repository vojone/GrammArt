class MSymbol {
  static ARG_ORDER = []

  static ARGS = {}

  constructor() {}

  hasArg(name) {
    return Object.hasOwn(this.ARGS, name);
  }
}

class NonTerminal extends MSymbol {
  constructor(id, cx, cy, csize) {
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

  ARGS = Object.assign(Terminal.ARGS, {
    "size" : validateNumber,
    "color" : acceptAllStrings,
  })

  constructor(x, y, size, color) {
    super(x, y);
    this.size = size;
    this.color = color;
  }
}


class Circle extends Terminal {
  ARG_ORDER = ["x", "y", "size", "color"]

  ARGS = {
    "x" : validateNumber,
    "y" : validateNumber,
    "size" : validateNumber,
    "color" : acceptAllStrings,
  }

  constructor(x, y, size, color) {
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
    for (const [_name, ruleList] of Object.entries(args)) {
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
  constructor(x, y, size, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
  }
}


class Interpreter {
  constructor() {
    this.ctx = SymbolCtx(0, 0, 1, 0x000000);
    this.grammar = null;
  }
}
