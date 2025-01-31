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

      let toParentResult = cursor.gotoParent();
      while(toParentResult) {
        if(cursor.gotoNextSibling()) {
          break;
        }

        toParentResult = cursor.gotoParent();
      }

      if(!toParentResult) {
        finished = true;
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


function acceptNumber(n) {
  let result = parseFloat(n.text);
  return isNaN(result) ? null : result;
}

function acceptNumberZeroToOne(n) {
  let result = parseFloat(n.text);
  return (isNaN(result) || result > 1 || result < 0) ? null : result;
}

function acceptPositiveNumberOrZero(n) {
  let result = parseFloat(n.text);
  return (isNaN(result) || result < 0) ? null : result;
}

function acceptAllStrings(n) {
  return n.text;
}

function acceptRGBString(node) {
  const channels = node.childrenForFieldName("channel");
  if(channels.length !== 3) {
    return null;
  }

  let result = [];
  for (let c = 0; c < 3; c++) {
    const channelStr = channels[c].text;
    let channelVal = parseFloat(channelStr);
    if(isNaN(channelVal) || channelVal < 0 || channelVal > 255) {
      return null;
    }
    else {
      result.push(channelVal);
    }
  }
  return result;
}

function acceptRGBDiffString(node) {
  const channels = node.childrenForFieldName("channel");
  if(channels.length !== 3) {
    return null;
  }

  let result = [];
  for (let c = 0; c < 3; c++) {
    const channelStr = channels[c].text;
    let channelVal = parseFloat(channelStr);
    if(isNaN(channelVal)) {
      return null;
    }
    else {
      result.push(channelVal);
    }
  }
  return result;
}
