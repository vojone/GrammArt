class Compiler extends Traverser {
  constructor() {
    super();
  }

  compile(tree, code) {
    let grammar = new Grammar([], null, {});
    this.inorder(tree, this.compileNode, { "grammar": grammar, "sourceCode" : code });

    //TODO: Check if entry point exists
    return grammar;
  }

  _getChildByFieldName(node, name, defval = null) {
    let ch = node.childrenForFieldName(name);
    return ch.length > 0 ? ch[0] : defval;
  }

  _getNodeContent(node, text) {
    return text.substring(node.startIndex, node.endIndex);
  }

  compileNode(node, ctx) {
    switch (node.type) {
      case "shape":
        let entryPointNode = node.childrenForFieldName("entry_point")[0];
        ctx.grammar.entryPoint = _getNodeContent(entryPointNode, ctx.sourceCode);
        break;

      case "rule_decl":
        let ruleName = _getChildByFieldName(node, "name");
        let weight = _getChildByFieldName(node, "weight", 1);
        let body = _getChildByFieldName(node, "body");

        break;

      default:
        break;
    }
  }
}
