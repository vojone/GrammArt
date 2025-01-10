/**
 * @file Subset of context free graphics language for GrammarArt project
 * @author Vojtěch Dvořák
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-nocheck

module.exports = grammar({
  name: "grammartcfg",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
