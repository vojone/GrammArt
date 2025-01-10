/**
 * The main file
 */

// Just hack to avoid Wrong MIME type error caused by loading tree sitter library
delete WebAssembly.instantiateStreaming;
const Parser = window.TreeSitter;

(async() => {
    await Parser.init()
    await parse();
})();

async function parse(params) {
    const parser = new Parser();
    const JavaScript = await Parser.Language.load('tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm');
    parser.setLanguage(JavaScript);
    const sourceCode = 'hello';
    const tree = parser.parse(sourceCode);
    console.log(tree);
    console.log(tree.rootNode.toString());
}
