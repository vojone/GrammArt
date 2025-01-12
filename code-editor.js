class Formatter {
  constructor(editorElement) {
    this.editorElement = editorElement;
  }

  static formatNode(ctx, node, className, title = "") {
    if(node === null) {
      return;
    }

    ctx.formatMarkers.push(new OpeningTag(node.startIndex, `${ctx.cls} ${className}`, title));
    ctx.formatMarkers.push(new ClosingTag(node.endIndex));
  }

  purifyString() {
    let str = $(this.editorElement).html();
    str = str.replaceAll("&nbsp;", " ").replaceAll("<br>", "\n");
    return str;
  }

  format(formatMarkers, text) {
    let indexOffset = 0;
    formatMarkers.forEach(fmt => {
      let tagString = fmt.toString();
      text = text.slice(0, fmt.index + indexOffset) + tagString + text.slice(fmt.index + indexOffset);
      indexOffset += tagString.length;
    });

    //text = text.replaceAll(/\n|\r\n/g, "<br>");
    $(this.editorElement).html(text);
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
    return `<span class="${this.htmlClassName}">`;
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

  processNode(node, ctx) {
    // TODO semantic checks
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

  processNode(node, ctx) {
    let skipDescendants = false;
    switch (node.type) {
      case "ERROR":
        console.log(node.toString());
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
