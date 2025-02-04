#!/bin/bash

mkdir dist
python3 scripts/to-base64.py deps/tree-sitter.wasm TREE_SITTER_WASM array >dist/tree-sitter-base64.js
python3 scripts/to-base64.py tree-sitter-grammartcfg/tree-sitter-grammartcfg.wasm TREE_SITTER_CFG_WASM string >dist/tree-sitter-grammartcfg-base64.js
