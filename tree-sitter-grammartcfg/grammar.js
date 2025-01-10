/**
 * @file Subset of context free graphics language for GrammarArt project
 * @author Vojtěch Dvořák
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-nocheck

module.exports = grammar({
  name: "grammartcfg",

  word: $ => $.identifier,

  rules: {
    source_file: $ => seq(
      $.shape,
      repeat($.rule_decl),
    ),

    shape: $ => seq(
      "startshape",
      field("entry_point", $.identifier),
    ),

    rule_decl: $ => seq(
      "rule",
      field("name", $.identifier),
      optional($.rule_weight),
      "{",
      repeat(
        $.built_in_rule,
      ),
      "}",
    ),

    rule_weight: $ => $.number,

    built_in_rule: $ => seq(
      field("type",
        choice(
          "square",
          "circle",
        ),
      ),
      field("body", $.body),
    ),

    body: $ => seq(
      "{",
      field("arguments",
        repeat(
          $.argument
        ),
      ),
      "}",
    ),

    argument: $ => seq(
      field("name", optional($.identifier)),
      field("value", $.number),
    ),

    identifier: $ => /[a-zA-Z][a-zA-Z0-9]*/,

    number: $ => /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/,
  }
});
