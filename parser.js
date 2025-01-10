class Traverser {
  constructor(tree) {
    self.tree = tree
  }

  inorder(processNodeCb, ctx) {
    let cursor = tree.rootNode.walk();
    let finished = false;

    while(!finished) {
      do {
        do {
          processNodeCb(cursor.currentNode, ctx);
        }
        while(cursor.gotoFirstChild());
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
