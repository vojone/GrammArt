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

function disable(button) {
  button.prop("disabled", true);
}

function enable(button) {
  button.removeAttr("disabled");
}

function finishLoading() {
  $("#loading-screen").hide();
  $("#content-wrapper").show();

  disable($("#canvas-stop"));
  disable($("#canvas-run"));
  disable($("#canvas-step"));
  disable($("#canvas-reset"));
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

  enable($("#canvas-stop"));
  disable($("#canvas-run"));
  enable($("#canvas-step"));
}

function canvasRun(interpreter) {
  runCompiled(interpreter);
}

function canvasStep(interpreter) {
  interpreter.stop();
  interpreter.step();

  disable($("#canvas-stop"));
  enable($("#canvas-run"));
  enable($("#canvas-step"));
}

function canvasStop(interpreter) {
  interpreter.stop();

  disable($("#canvas-stop"));
  enable($("#canvas-run"));
  enable($("#canvas-step"));
}

function canvasExport(interpreter) {
  interpreter.stop();
  $("#export-name").val(`Image-GrammarArt-${dateString()}`);
}

async function setup(params) {
  let wasInterpreterRunning;
  const parser = new Parser();
  const languagePath = "tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm";
  const language = (typeof TREE_SITTER_CFG_WASM === 'undefined' || TREE_SITTER_CFG_WASM === null) ? languagePath : TREE_SITTER_CFG_WASM;
  const CFGLanguageGrammar = await Parser.Language.load(language);
  parser.setLanguage(CFGLanguageGrammar);

  let codeEditor = new CodeEditor(
    $("#code-editor"),
    $("#line-numbering"),
    $("#error-log-counts"),
    $("#error-log-no-errors"),
    $("#error-log-messages"),
    parser
  );
  codeEditor.init();

  let compiler = new Compiler();
  let interpreter = new Interpreter(new InitialCtx(250, 250, 10, "black", 0), $("#main-canvas"));

  sessionStorage.setItem("test_val", "value");
  let data = sessionStorage.getItem("test_val");
  console.log(data);

  $(document).keydown(e => {
    const origEvent = e.originalEvent;
    if (origEvent.ctrlKey && origEvent.key == "Enter") {
      compile(codeEditor, parser, compiler, interpreter);
      runCompiled(interpreter);
    }
    else if(!$("#canvas-run[disabled]").length && origEvent.altKey && origEvent.shiftKey && origEvent.key == "ArrowRight") {
      canvasRun(interpreter);
    }
    else if(!$("#canvas-strp[disabled]").length && origEvent.altKey && origEvent.shiftKey && origEvent.key == "ArrowUp") {
      canvasStep(interpreter);
    }
    else if(!$("#canvas-stop[disabled]").length && origEvent.altKey && origEvent.shiftKey && origEvent.key == "ArrowDown") {
      canvasStop(interpreter);
    }
    else if(origEvent.altKey && origEvent.shiftKey && (origEvent.key == "e" || origEvent.key == "E")) {
      $("#save-modal").modal("show");
      wasInterpreterRunning = interpreter.isRunning;
      canvasExport(interpreter);
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

    enable($("#canvas-run"));
    enable($("#canvas-step"));
    enable($("#canvas-reset"));
  });
  $("#code-compile-run").click(() => {
    compile(codeEditor, parser, compiler, interpreter);
    runCompiled(interpreter);

    enable($("#canvas-reset"));
  });

  $("#canvas-export").click(() => {
    wasInterpreterRunning = interpreter.isRunning;
    canvasExport(interpreter);
  });

  $("#save-modal").on("hidden.bs.modal", () => {
    if(wasInterpreterRunning) {
      interpreter.run();
    }
  });

  $("#save-modal").on("shown.bs.modal", () => {
    $("#canvas-export-button").focus();
  });

  $("#canvas-export-button").click(() => {
    let canvaBoundingRect = $("#main-canvas")[0];
    let canvasWidth = canvaBoundingRect.width;
    let canvasHeight = canvaBoundingRect.height;
    let resolutionFactor = $("#export-resolution").val();

    downloadCanvasContent("main-canvas", $("#export-name").val(), canvasWidth * resolutionFactor, canvasHeight * resolutionFactor);
  });

  $("#canvas-run").click(() => {
    canvasRun(interpreter);
  });

  $("#canvas-stop").click(() => {
    canvasStop(interpreter);
  });

  $("#canvas-reset").click(() => {
    interpreter.stop();
    interpreter.reset();
    interpreter.clear();
    interpreter.init();

    disable($("#canvas-stop"));
    enable($("#canvas-run"));
    enable($("#canvas-step"));
  });

  $("#canvas-step").click(() => {
    canvasStep(interpreter);
  });
}
