class Formatter {
  constructor(editorElement) {
    this.editorElement = editorElement;
  }

  format(formatMarkers) {
    let text = $(this.editorElement).text();
    let indexOffset = 0;
    formatMarkers.forEach(fmt => {
      let tagString = fmt.toString();
      text = text.slice(0, fmt.index + indexOffset) + tagString + text.slice(fmt.index + indexOffset);
      indexOffset += tagString.length;
    });
    $(this.editorElement).html(text);
  }

  clearFormatting() {
    let tags = $(this.editorElement).find("span.hght, span.lnt");
    tags.each((_i, e) => {
      $(e).replaceWith($(e).html());
    });
  }
}


class FormatTag {
  constructor(index) {
    this.index = index;
  }

  static sort(f1, f2) {
    return f1.index > f2.index;
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
  constructor(tree, cls, editorElement) {
    super(tree);
    this.cls = cls;
    this.editorElement = editorElement;
  }

  lint() {
    let text = $(this.editorElement).text();
    console.log(text);
    let formatMarkers = [];
    this.inorder(this.processNode, { "text": text, "formatMarkers": formatMarkers });
    return formatMarkers;
  }

  processNode(node, ctx) {
    if(node.type == "ERROR") {
      ctx.formatMarkers.push(new OpeningTag(node.startIndex, `${this.cls} err`, "Syntax error"));
      ctx.formatMarkers.push(new ClosingTag(node.endIndex));
    }
  }
}


class TokenClass {
  constructor(regex, htmlClassName) {
    this.regex = regex;
    this.htmlClassName = htmlClassName;
  }
}


class Highlighter {
  KEYWORD = /startshape|rule|square|circle/g

  IDENTIFIER = /[a-zA-Z][a-zA-Z0-9]*/g

  NUMBER = /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/g

  TOKEN_TYPES = [
    new TokenClass(this.IDENTIFIER, "id"),
    new TokenClass(this.NUMBER, "num"),
    new TokenClass(this.KEYWORD, "kw"),
  ]

  constructor(cls, editorElement) {
    this.cls = cls;
    this.editorElement = editorElement;
  }

  highlight() {
    let text = $(this.editorElement).text();
    let formatMarkers = [];
    let match = null;
    this.TOKEN_TYPES.forEach(tokenType => {
      while ((match = tokenType.regex.exec(text)) !== null) {
        formatMarkers.push(new OpeningTag(match.index, `${this.cls} ${tokenType.htmlClassName}`));
        formatMarkers.push(new ClosingTag(match.index + match[0].length));
      }
    });

    return formatMarkers;
  }
}
