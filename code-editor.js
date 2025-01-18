class Formatter {
  constructor(editorElement) {
    this.editorElement = editorElement;
  }

  static formatNode(ctx, node, className, title = "", offsetStart = 0, offsetEnd = 0) {
    if(node === null) {
      return;
    }

    ctx.formatMarkers.push(new OpeningTag(node.startIndex + offsetStart, `${ctx.cls} ${className}`, title));
    ctx.formatMarkers.push(new ClosingTag(node.endIndex + offsetEnd));
  }

  format(formatMarkers, text) {
    let indexOffset = 0;
    formatMarkers.forEach(fmt => {
      let tagString = fmt.toString();
      text = text.slice(0, fmt.index + indexOffset) + tagString + text.slice(fmt.index + indexOffset);
      indexOffset += tagString.length;
    });

    return text;
  }

  clearFormatting() {
    let finished = false;
    while (!finished) {
      let tags = $(this.editorElement).find("span.hght, span.lnt");
      if(tags.length == 0) {
        finished = true;
      }
      else {
        tags.each((_i, e) => {
          $(e).replaceWith($(e).html());
        });
      }
    }
  }
}


class FormatTag {
  constructor(index) {
    this.index = index;
  }

  static sort(f1, f2) {
    return f1.index - f2.index;
  }
}


class OpeningTag extends FormatTag {
  constructor(index, htmlClassName, title="") {
    super(index, htmlClassName);
    this.htmlClassName = htmlClassName;
    this.title = title;
  }

  toString() {
    return `<span class="${this.htmlClassName}" title="${this.title}">`;
  }
}


class ClosingTag extends FormatTag {
  constructor(index) {
    super(index);
  }

  toString() {
    return "</span>";
  }
}


class Linter extends Traverser {
  constructor(cls) {
    super();
    this.cls = cls;
  }

  lint(tree, text) {
    let formatMarkers = [];
    this.inorder(tree, this.processNode, { "text": text, "formatMarkers": formatMarkers, "cls" : this.cls });
    return formatMarkers;
  }

  // Language specific function
  processNode(node, ctx) {
    console.log(node.type);
    console.log(node);
    return true;
  }
}


class TokenClass {
  constructor(regex, htmlClassName, isKeywordclass = false) {
    this.regex = regex;
    this.htmlClassName = htmlClassName;
    this.isKeywordclass = isKeywordclass;
  }
}


class Highlighter extends Traverser {
  constructor(cls) {
    super();
    this.cls = cls;
  }

  highlight(tree, text) {
    let formatMarkers = [];
    this.inorder(tree, this.processNode, { "text": text, "formatMarkers": formatMarkers, "cls" : this.cls });
    return formatMarkers;
  }

  // Language specific function
  processNode(node, ctx) {
    let skipDescendants = false;
    if(node.isMissing) {
      Formatter.formatNode(ctx, node, "err", `Missing ${node.type}`, -1);
      return skipDescendants;
    }

    switch (node.type) {
      case "ERROR":
        Formatter.formatNode(ctx, node, "err", "Syntax error");
        break;

      case "shape":
        var entryNode = node.childForFieldName("entry_point");
        Formatter.formatNode(ctx, entryNode, "id");
        break;

      case "rule_decl":
        var nameNode = node.childForFieldName("name");
        Formatter.formatNode(ctx, nameNode, "id b");
        break;

      case "argument":
        var nameNode = node.childForFieldName("name");
        Formatter.formatNode(ctx, nameNode, "argn");
        var valNode = node.childForFieldName("value");
        Formatter.formatNode(ctx, valNode, "num");
        skipDescendants = true;
        break;

      case "non_terminal":
        var nameNode = node.childForFieldName("name");
        Formatter.formatNode(ctx, nameNode, "id");
        break;

      case "comment":
        Formatter.formatNode(ctx, node, "comment");
        break;

      case "startshape":
      case "rule":
      case "square":
      case "circle":
        Formatter.formatNode(ctx, node, "kw");
        break;

      default:
        break;
    }

    return skipDescendants;
  }
}


class CodeEditor {
  static NEWLINE_REGEXP = /(\r?\n)/g;

  MAX_REVISIONS = 20

  constructor(editor, lineNumbers, parser) {
    this.editor = editor;
    this.lineNumbers = lineNumbers;
    this.origLineNumber = null;
    this.cursorOffset = 0;
    this.highlighter = new Highlighter("hght", editor);
    this.linter = new Linter("lnt", editor);
    this.formatter = new Formatter(editor);
    this.parser = parser;
    this.previousRevisions = [];
    this.previousCursors = [];

    let userAgentString = navigator.userAgent;
    this.isChrome = userAgentString.indexOf("Chrome") > -1;
  }

  init() {
    if(this.isChrome) {
      this.editor.prop("contentEditable", "plaintext-only");
    }

    this.formatCode();
    this.initNumbering();

    this.editor[0].addEventListener("beforeinput", (e) => {
      this.saveRevision();

      if(e.inputType == "deleteContentBackward") {
        this._storeCursor(e);
        if(window.getSelection().getRangeAt(0).collapsed) {
          this.cursorOffset -= 1;
        }
      }

      // if(!this.isChrome) { this._updateNumbering(e); }
    });

    this.editor[0].addEventListener("input", (e) => {
      if(e.inputType !== "deleteContentBackward") {
        this._storeCursor(e);
      }

      this.initNumbering();
      this.formatCode();
      this._restoreCursor();
    });

    this.editor[0].addEventListener("keydown", (e) => {
      if (e.ctrlKey && e.key == 'z') {
        e.preventDefault();
        if(this.previousRevisions.length > 0) {
          this.editor[0].innerHTML = this.previousRevisions.pop();
          this.initNumbering();
          this.formatCode();
        }

        if(this.previousCursors.length > 0) {
          this.cursor = this.previousCursors.pop();
          this.putCursorToOffset(this.cursor);
        }
      }
    });
  }

  saveRevision() {
    if(this.previousRevisions.length == this.MAX_REVISIONS) {
      this.previousRevisions.shift();
      this.previousCursors.shift();
    }

    this.previousRevisions.push(this.getCode());

    let range = window.getSelection().getRangeAt(0);
    this.cursorOffset = this.getOffsetInEditor(range.startContainer, range.startOffset);
    this.previousCursors.push(this.cursorOffset);
  }

  formatCode() {
    this.formatter.clearFormatting();
    let code = this.editor.html().replaceAll("&nbsp;", " ").replaceAll("<br>", "\n");

    if(code.match(/(\n|<br>)$/) == null) {
      code += "\n\n";
    }

    const tree = this.parser.parse(code);

    const fmt = [...this.highlighter.highlight(tree, code) ];

    const sortedFmt = fmt.sort(FormatTag.sort);
    const formatted = this.formatter.format(sortedFmt, code);

    this.editor.html(formatted);
  }

  clearFormatting() {
    this.formatter.clearFormatting();
  }

  _restoreCursor() {
    this.putCursorToOffset(this.cursorOffset);
  }


  _storeCursor(_e) {
    let range = window.getSelection().getRangeAt(0);
    this.cursorOffset = this.getOffsetInEditor(range.startContainer, range.startOffset);
  }

  getCode() {
    return this.editor.text();
  }

  initNumbering() {
    const originalText = this.getCode();
    const originalNewlines = originalText.matchAll(CodeEditor.NEWLINE_REGEXP).toArray();
    this.origLineNumber = originalNewlines.length;
    if(originalText.match(/(\r?\n)$/g) !== null) {
      this.origLineNumber -= 1;
    }

    this.setLineNumbering(this.origLineNumber);
  }

  _updateNumbering(e) {
    if(e.inputType == "insertFromPaste") {
      return; // It is hadnled in input event to be sure that any newline do not disappear
    }

    var extraNewlines = 0;
    var insertedText = "";

    if(this.origLineNumber === null) {
      const originalText = this.editor.text();
      const originalNewlines = originalText.matchAll(CodeEditor.NEWLINE_REGEXP).toArray();
      extraNewlines = originalNewlines.length;
      this.origLineNumber = 0;
    }

    let targetRanges = e.getTargetRanges();
    if(targetRanges.length > 0) {
      let startOffset = this.getOffsetInEditor(
        e.getTargetRanges()[0].startContainer,
        e.getTargetRanges()[0].startOffset,
      );
      let endOffset = this.getOffsetInEditor(
        e.getTargetRanges()[0].endContainer,
        e.getTargetRanges()[0].endOffset,
      );

      let affectedText = this.editor.text().substring(startOffset, endOffset);
      const deletedNewlines = affectedText.matchAll(CodeEditor.NEWLINE_REGEXP).toArray();
      extraNewlines -= deletedNewlines.length;
    }

    if(e.inputType == "insertParagraph") {
      insertedText = "\n";
    }
    else if(e.inputType == "insertText") {
      insertedText = e.data;
    }

    const newNewlines = insertedText.matchAll(CodeEditor.NEWLINE_REGEXP).toArray();
    extraNewlines += newNewlines.length;
    if(extraNewlines != 0) {
      this.setLineNumbering(this.origLineNumber + extraNewlines);
    }
  }

  setLineNumbering(lineNumber) {
    this.lineNumbers.html("");
    for (let line = 0; line <= lineNumber; line++) {
      this.lineNumbers.append(`<div id="l${line}" class="lineno">${line + 1}</div>`)
    }

    this.origLineNumber = lineNumber;
  }

  getOffsetInEditor(node, initialOffset) {
    let offset = initialOffset;
    let editorElement = this.editor[0];
    while(node != editorElement) {
      let parentNode = node.parentNode;
      let childNode = parentNode.firstChild;
      while(childNode != node) {
        if(childNode.nodeType == Node.TEXT_NODE) {
          offset += childNode.length;
        }
        else {
          offset += childNode.innerText.length;
        }

        childNode = childNode.nextSibling;
      }

      node = parentNode;
    }

    return offset;
  }

  putCursorToOffset(_offset) {
    function findNodeOnOffset(node, offset) {
      if(node.nodeType == Node.TEXT_NODE && node.length >= offset) {
        return [node, offset];
      }

      let cNode = node.firstChild;
      while(cNode !== null) {
        let nodeTextLength = cNode.nodeType == Node.TEXT_NODE ? cNode.length : cNode.innerText.length;
        if(offset <= nodeTextLength) {
          return findNodeOnOffset(cNode, offset);
        }
        else {
          offset -= nodeTextLength;
        }

        cNode = cNode.nextSibling;
      }

      return [null, null];
    }

    let editorElement = this.editor[0];
    let [node, offset] = findNodeOnOffset(editorElement, _offset);

    let range = document.createRange();
    let curSelection = window.getSelection();
    range.setStart(node, offset);
    range.setEnd(node, offset);
    range.collapse(true);
    curSelection.removeAllRanges();
    curSelection.addRange(range);
  }
}
