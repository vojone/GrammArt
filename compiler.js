var root;
class Compiler extends Traverser {
  constructor() {
    super();
  }

  compile(tree, code) {
    let grammar = new Grammar([], null, {});
    this.inorder(tree, Compiler.compileNode, { "grammar": grammar, "sourceCode" : code });
    root = tree.rootNode;
    //TODO: Check if entry point exists
    return grammar;
  }

  static compileNode(node, ctx) {
    let skipDescendants = false;
    switch (node.type) {
      case "shape":
        let entryPointNode = node.childrenForFieldName("entry_point")[0];
        ctx.grammar.entryPoint = entryPointNode.text;
        skipDescendants = true; // Skip descendants, there are already parsed
        break;

      case "rule_decl":
        let ruleName = getStringByFieldName(node, "name");
        let weight = getFloatByFieldName(node, "weight", 1.0);
        let body = getChildByFieldName(node, "body");

        let descendants = [];
        if(body !== null) {
          let children = body.childrenForFieldName("symbol");
          children.forEach((symbol) => {
            if(symbol.type == "terminal") {
              descendants.push(Compiler.compileTerminal(symbol));
            }
            else if(symbol.type == "non_terminal") {
              descendants.push(Compiler.compileNonTerminal(symbol));
            }
          });
        }

        ctx.grammar.addNewRule(ruleName, new Rule(ruleName, descendants, weight));
        skipDescendants = true; // Skip descendants in AST, there are already parsed
        break;

      default:
        break;
    }

    return skipDescendants;
  }

  static compileTerminal(terminalNode) {
    let type = getStringByFieldName(terminalNode, "type");
    let argumentsNode = getChildByFieldName(terminalNode, "arguments");
    let [unnamedArgs, namedArgs] = Compiler.compileArguments(argumentsNode);
    return Compiler.createTerminal(type, unnamedArgs, namedArgs);
  }

  static compileNonTerminal(terminalNode) {
    let name = getStringByFieldName(terminalNode, "name");
    let argumentsNode = getChildByFieldName(terminalNode, "arguments");
    let [unnamedArgs, namedArgs] = Compiler.compileArguments(argumentsNode);
    return Compiler.createNonTerminal(name, unnamedArgs, namedArgs);
  }

  static compileArguments(argumentsNode) {
    let args = argumentsNode.childrenForFieldName("arg");

    let unnamedArgs = [];
    let namedArgs = {};
    args.forEach((argNode) => {
      let argName = getStringByFieldName(argNode, "name");
      let argVal = getStringByFieldName(argNode, "value");

      if(Object.keys(namedArgs).length > 0 && argName === null) {
        throw new Error("Unnamed argument after named ones!");
      }

      if(argName !== null) {
        namedArgs[argName] = argVal;
      }
      else {
        unnamedArgs.push(argVal);
      }
    });

    return [unnamedArgs, namedArgs];
  }

  static createTerminal(type, unnamedArgs, namedArgs) {
    let typeCls = null;
    switch (type) {
      case "square":
        typeCls = Square;
        break;
      case "circle":
        typeCls = Circle;
        break;
      default:
        throw new Error("Unsupported terminal type!");
    }

    const pUnnamed = Compiler._processUnnamedArgs(typeCls, unnamedArgs);
    const pNamed = Compiler._processNamedArgs(typeCls, namedArgs);
    const merged = Compiler._mergeArgs(pUnnamed, pNamed);
    return new typeCls(...Compiler._createArgArray(typeCls, merged));
  }

  static createNonTerminal(id, unnamedArgs, namedArgs) {
    const pUnnamed = Compiler._processUnnamedArgs(NonTerminal, unnamedArgs);
    const pNamed = Compiler._processNamedArgs(NonTerminal, namedArgs);
    const merged = Compiler._mergeArgs(pUnnamed, pNamed);
    return new NonTerminal(id, ...Compiler._createArgArray(NonTerminal, merged));
  }

  static _processUnnamedArgs(smybolCls, args) {
    if (smybolCls.ARGS.length < args.length) {
      throw new Error(`Too many arguments for terminal ${type}`);
    }

    let result = {};
    for (let index = 0; index < args.length; index++) {
      const argStr = args[index];
      const argName = smybolCls.ARG_ORDER[index];

      if(!Object.hasOwn(smybolCls.ARGS, argName)) {
        throw new Error(`Internal error! Unknown argument '${argName}'!`);
      }

      const argVal = smybolCls.ARGS[argName](argStr);
      if(argVal === null) {
        throw new Error(`Cannot parse value ${argStr}!`);
      }

      result[argName] = argVal;
    }

    return result;
  }

  static _processNamedArgs(symbolCls, args) {
    let result = {};
    for (const [key, value] of Object.entries(args)) {
      if(!Object.hasOwn(symbolCls.ARGS, key)) {
        throw new Error(`Internal error! Unknown argument '${key}'!`);
      }

      const argVal = symbolCls.ARGS[key](value);
      if(argVal === null) {
        throw new Error(`Cannot parse value ${value}!`);
      }

      result[key] = argVal;
    }

    return result;
  }

  static _checkCollisions(args1, args2) {
    for (const [key, _] of Object.entries(args1)) {
      if(Object.hasOwn(args2, key)) {
        throw new Error(`${key} already defined!`);
      }
    }
  }

  static _mergeArgs(args1, args2) {
    return Object.assign(args1, args2);
  }

  static _createArgArray(smybolCls, args) {
    let result = [];
    smybolCls.ARG_ORDER.forEach(argName => {
      result.push(args[argName]);
    });

    return result;
  }
}
