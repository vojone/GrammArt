class Traverser {
  inorder(tree, processNodeCb, ctx) {
    let cursor = tree.rootNode.walk();
    let finished = false;
    let skipDescendants = false;

    while(!finished) {
      do {
        do {
          skipDescendants = processNodeCb(cursor.currentNode, ctx);
        }
        while(!skipDescendants && cursor.gotoFirstChild());
      }
      while(cursor.gotoNextSibling());

      while(cursor.gotoParent()) {
        if(cursor.gotoNextSibling()) {
          finished = false;
          break;
        }
        else {
          finished = true;
        }
      }
    }

  }
}

function getChildByFieldName(node, name, defval = null) {
  let ch = node.childrenForFieldName(name);
  return ch.length > 0 ? ch[0] : defval;
}

function getStringByFieldName(node, name, defval = null) {
  let ch = node.childrenForFieldName(name);
  return ch.length > 0 ? ch[0].text : defval;
}

function getFloatByFieldName(node, name, defval = null) {
  let ch = node.childrenForFieldName(name);
  if(ch.length == 0) {
    return defval;
  }

  let floatVal = parseFloat(ch[0].text);
  if(isNaN(floatVal)) {
    throw new Error(`Cannot parse float value '${ch[0].text}'`);
  }

  return floatVal;
}
