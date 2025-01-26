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

    // Hide spinner, show loader
    finishLoading();
  })();
});

function finishLoading() {
  $("#loading-screen").hide();
  $("#content-wrapper").show();
}

function dateString() {
  let currentDate = new Date();
  let currentDateStr = `${padZero(currentDate.getDate())}${padZero(currentDate.getMonth() + 1)}-${padZero(currentDate.getHours())}${padZero(currentDate.getMinutes())}${padZero(currentDate.getSeconds())}`;
  return currentDateStr;
}

function compile(codeEditor, parser, compiler, interpreter) {
  let code = codeEditor.getCode();
  interpreter.reset();
  interpreter.clear();

  const tree = parser.parse(code);
  const grammar = compiler.compile(tree, code);
  interpreter.setGrammar(grammar);
  interpreter.init();
}


function runCompiled(interpreter) {
  interpreter.run();
}


async function setup(params) {
  let wasInterpreterRunning;
  const parser = new Parser();
  const languagePath = "tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm";
  const language = (typeof TREE_SITTER_CFG_WASM === 'undefined' || TREE_SITTER_CFG_WASM === null) ? languagePath : TREE_SITTER_CFG_WASM;
  const CFGLanguageGrammar = await Parser.Language.load(language);
  parser.setLanguage(CFGLanguageGrammar);

  let codeEditor = new CodeEditor($("#code-editor"), $("#line-numbering"), parser);
  codeEditor.init();

  let compiler = new Compiler();
  let interpreter = new Interpreter(new InitialCtx(250, 250, 10, "black", 0), $("#main-canvas"));

  sessionStorage.setItem("test_val", "value");
  let data = sessionStorage.getItem("test_val");
  console.log(data);

  $(document).keydown(e => {
    const origEvent = e.originalEvent;
    if (origEvent.ctrlKey && origEvent.key == 'Enter') {
      compile(codeEditor, parser, compiler, interpreter);
      runCompiled(interpreter);
    }
  });

  $("#code-save").click(() => {
    let code = codeEditor.getCode();
    downloadText(code, `GrammArt-${dateString()}.gcfg`);
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
    compile(codeEditor, parser, compiler, interpreter);
  });
  $("#code-compile-run").click(() => {
    compile(codeEditor, parser, compiler, interpreter);
    runCompiled(interpreter);
  });

  $("#canvas-export").click(() => {
    wasInterpreterRunning = interpreter.isRunning;
    interpreter.stop();
    $("#export-name").val(`Image-GrammarArt-${dateString()}`);
  });

  $("#save-modal").on("hidden.bs.modal", () => {
    if(wasInterpreterRunning) {
      interpreter.run();
    }
  });

  $("#canvas-export-button").click(() => {
    let canvaBoundingRect = $("#main-canvas")[0];
    let canvasWidth = canvaBoundingRect.width;
    let canvasHeight = canvaBoundingRect.height;
    let resolutionFactor = $("#export-resolution").val();

    downloadCanvasContent("main-canvas", $("#export-name").val(), canvasWidth * resolutionFactor, canvasHeight * resolutionFactor);
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
