/**
 * The main file
 */

// Just hack to avoid Wrong MIME type error caused by loading tree sitter library
delete WebAssembly.instantiateStreaming;
const Parser = window.TreeSitter;

$(document).ready(() => {
  (async() => {
    if(typeof TREE_SITTER_WASM === "undefined" || TREE_SITTER_WASM === null) {
      await Parser.init();
    }
    else {
      await Parser.init({"wasmBinary" : TREE_SITTER_WASM});
    }
    await setup();
  })();
});


async function setup(params) {
  const parser = new Parser();
  const languagePath = "tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm";
  const language = (typeof TREE_SITTER_CFG_WASM === 'undefined' || TREE_SITTER_CFG_WASM === null) ? languagePath : TREE_SITTER_CFG_WASM;
  const CFGLanguageGrammar = await Parser.Language.load(language);
  parser.setLanguage(CFGLanguageGrammar);

  let codeEditor = new CodeEditor($("#code-editor"), $("#line-numbering"), parser);
  codeEditor.init();

  let compiler = new Compiler();
  let interpreter = new Interpreter(new InitialCtx(250, 250, 10, "black", 0), $("#main-canvas"));

  $("#code-save").click(() => {
    let code = codeEditor.getCode();
    let currentDate = new Date();
    let currentDateStr = `${padZero(currentDate.getDate())}${padZero(currentDate.getMonth() + 1)}-${padZero(currentDate.getHours())}${padZero(currentDate.getMinutes())}${padZero(currentDate.getSeconds())}`;
    downloadText(code, `GrammarArt-${currentDateStr}.gcfg`);
  });
  $("#code-load").click(() => {
    loadTextFileInput((code) => {
      codeEditor.setCode(code);
    }).click();
  });
  $("#code-format").click(() => {
    codeEditor.formatCode();
  });
  $("#code-compile").click(() => {
    let code = codeEditor.getCode();
    const tree = parser.parse(code);
    const grammar = compiler.compile(tree, code);
    console.log(grammar);
    interpreter.setGrammar(grammar);
  });
  $("#code-compile-run").click(() => {
    let code = codeEditor.getCode();
    interpreter.reset();
    interpreter.clear();

    const tree = parser.parse(code);
    const grammar = compiler.compile(tree, code);
    interpreter.setGrammar(grammar);

    interpreter.init();
    interpreter.run();
  });

  $("#canvas-download").click(() => {
    downloadCanvasContent("main-canvas", "result", 500, 500);
  });

  $("#canvas-run").click(() => {
    interpreter.run();
  });

  $("#canvas-stop").click(() => {
    interpreter.stop();
  });

  $("#canvas-reset").click(() => {
    interpreter.stop();
    interpreter.reset();
    interpreter.clear();
    interpreter.init();
  });

  $("#canvas-step").click(() => {
    interpreter.stop();
    interpreter.step();
  });
}
