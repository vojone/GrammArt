#!/bin/bash

pushd "tree-sitter-grammartcfg" || exit 1 && npm i && install && popd || exit 1
