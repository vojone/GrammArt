/**
 * The main file
 */

// Just hack to avoid Wrong MIME type error caused by loading tree sitter library
delete WebAssembly.instantiateStreaming;
const Parser = window.TreeSitter;

(async() => {
  await Parser.init()
  await main();
})();

async function main(params) {
  const parser = new Parser();
  const CFGLanguageGrammar = await Parser.Language.load('tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm');
  parser.setLanguage(CFGLanguageGrammar);

  let highlighter = new Highlighter("hght", $("#code-editor"));
  let linter = new Linter("lnt", $("#code-editor"));
  let formatter = new Formatter($("#code-editor"));

  $("#b1").click(() => {
    formatter.clearFormatting();
    let code = formatter.purifyString();
    const tree = parser.parse(code);

    let fmt = [...highlighter.highlight(code), ...linter.lint(tree, code)];
    sortedFmt = fmt.sort(FormatTag.sort);
    formatter.format(sortedFmt, code);
  });
  $("#b2").click(() => {

  });

  $("#code-editor").on("click", () => {
    let editor = $("#code-editor");
    let editorContent = editor.text();
    console.log(document.getSelection());
  });
}
