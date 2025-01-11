class Formatter {
  constructor(editorElement) {
    this.editorElement = editorElement;
  }

  purifyString() {
    let str = $(this.editorElement).html();
    console.log(str);
    str = str.replaceAll("&nbsp;", " ").replaceAll("<br>", "\n");
    console.log(str);
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
  constructor(cls, editorElement) {
    super();
    this.cls = cls;
    this.editorElement = editorElement;
  }

  lint(tree, text) {
    let formatMarkers = [];
    this.inorder(tree, this.processNode, { "text": text, "formatMarkers": formatMarkers, "cls" : this.cls });
    return formatMarkers;
  }

  processNode(node, ctx) {
    let clsName = ctx.cls;
    if(node.type == "ERROR") {
      ctx.formatMarkers.push(new OpeningTag(node.startIndex, `${clsName} err`, "Syntax error"));
      ctx.formatMarkers.push(new ClosingTag(node.endIndex));
    }
  }
}


class TokenClass {
  constructor(regex, htmlClassName, isKeywordclass = false) {
    this.regex = regex;
    this.htmlClassName = htmlClassName;
    this.isKeywordclass = isKeywordclass;
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

  highlight(text) {
    let formatMarkers = [];
    let match = null;
    let clsName = this.cls;
    this.TOKEN_TYPES.forEach((tokenType) => {
      while ((match = tokenType.regex.exec(text)) !== null) {
        formatMarkers.push(new OpeningTag(match.index, `${clsName} ${tokenType.htmlClassName}`));
        formatMarkers.push(new ClosingTag(match.index + match[0].length));
      }
    });
    return formatMarkers;
  }
}
