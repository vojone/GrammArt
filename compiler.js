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

    return Compiler.createTerminal(type, unnamedArgs, namedArgs);
  }

  static createTerminal(type, unnamedArgs, namedArgs) {
    function _processUnnamedArgs(terminalCls, args) {
      if (terminalCls.ARGS.length < args.length) {
        throw new Error(`Too many arguments for terminal ${type}`);
      }

      let result = {};
      for (let index = 0; index < args.length; index++) {
        const argStr = args[index];
        const argName = terminalCls.ARG_ORDER[index];

        if(!Object.hasOwn(terminalCls.ARGS, argName)) {
          throw new Error(`Internal error! Unknown argument '${argName}'!`);
        }

        const argVal = terminalCls.ARGS[argName](argStr);
        if(argVal === null) {
          throw new Error(`Cannot parse value ${argStr}!`);
        }

        result[argName] = argVal;
      }

      return result;
    }

    function _processNamedArgs(terminalCls, args) {
      let result = {};
      for (const [key, value] of Object.entries(args)) {
        if(!Object.hasOwn(terminalCls.ARGS, key)) {
          throw new Error(`Internal error! Unknown argument '${key}'!`);
        }

        const argVal = terminalCls.ARGS[key](value);
        if(argVal === null) {
          throw new Error(`Cannot parse value ${value}!`);
        }

        result[argName] = argVal;
      }

      return result;
    }

    function _checkCollisions(args1, args2) {
      for (const [key, _] of Object.entries(args1)) {
        if(Object.hasOwn(args2, key)) {
          throw new Error(`${key} already defined!`);
        }
      }
    }

    function _mergeArgs(args1, args2) {
      return Object.assign(args1, args2);
    }

    function _createArgArray(terminalCls, args) {
      let result = [];
      terminalCls.ARG_ORDER.forEach(argName => {
        result.push(args[argName]);
      });

      return result;
    }

    switch (type) {
      case "square":
        var pUnnamed = _processUnnamedArgs(Square, unnamedArgs);
        var pNamed = _processNamedArgs(Square, namedArgs);
        var merged = _mergeArgs(pUnnamed, pNamed);
        return new Square(..._createArgArray(Square, merged));

      case "circle":
        var pUnnamed = _processUnnamedArgs(Circle, unnamedArgs);
        var pNamed = _processNamedArgs(Circle, namedArgs);
        var merged = _mergeArgs(pUnnamed, pNamed);
        return new Circle(..._createArgArray(Circle, merged));

      default:
        throw new Error("Unsupported terminal type!");
    }
  }
}
