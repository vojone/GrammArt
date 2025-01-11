class Rule {
  constructor(descendants = [], cx, cy, csize, weight) {
    this.descendants = descendants;
    this.cx = cx;
    this.cy = cy;
    this.csize = csize;
    this.weight = weight;
  }
}


class Grammar {
  constructor(rules = {}, entryPoint = null, options = {}) {
    this.rules = rules;
    this.entryPoint = entryPoint;
    this.options = options;
  }

  hasRule(name) {
    return Object.hasOwn(this.rules, name);
  }

  addRule(name, rule) {
    if(this.hasRule(name)) {
      this.rules.push(rule);
      return true;
    }
    else {
      this.rules[name] = [rule];
      return false;
    }
  }
}


class InterpreterCtx {
  constructor(x, y, size, color) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.color = color;
  }
}


class Interpreter {
  constructor() {
    this.ctx = InterpreterCtx(0, 0, 1, 0x000000);
    this.grammar = null;
  }
}
