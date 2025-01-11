var root;
class Compiler extends Traverser {
  constructor() {
    super();
  }

  compile(tree, code) {
    let grammar = new Grammar([], null, {});
    this.inorder(tree, this.compileNode, { "grammar": grammar, "sourceCode" : code });
    root = tree.rootNode;
    //TODO: Check if entry point exists
    return grammar;
  }

  compileNode(node, ctx) {
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
              let type = getStringByFieldName(symbol, "type");
              let argumentsNode = getChildByFieldName(symbol, "arguments");
              let args = argumentsNode.childrenForFieldName("arg");

              let parsedArgs = [];
              args.forEach((argNode) => {
                let argName = getStringByFieldName(argNode, "name");
                let argVal = getStringByFieldName(argNode, "value");
                // TODO
                parsedArgs.push(argVal);
              });

              descendants.push(new Terminal(type, ...parsedArgs));
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
}
