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

  extras: $ => [
    $.comment,
    /[\s]/,
  ],

  rules: {
    source_file: $ => optional(
      seq(
        optional($.global_settings),
        $.shape,
        repeat($.rule_decl),
      )
    ),

    global_settings: $ => seq(
      "global",
      field("arguments", $.arguments),
    ),

    shape: $ => seq(
      "startshape",
      field("entry_point", $.identifier),
    ),

    rule_decl: $ => seq(
      "rule",
      field("name", $.identifier),
      optional(
        field("weight", $.rule_weight)
      ),
      "{",
      optional(
        field("body", $.rule_decl_body),
      ),
      "}",
    ),

    rule_decl_body: $ => repeat1(
      field("symbol",
        choice(
          $.terminal,
          $.non_terminal,
        )
      )
    ),

    rule_weight: $ => $.number,

    non_terminal: $ => seq(
      field("name", $.identifier),
      field("arguments", $.arguments),
    ),

    terminal: $ => seq(
      field("type", $.terminal_type),
      field("arguments", $.arguments),
    ),

    terminal_type: $ => choice(
      "square",
      "circle",
    ),

    arguments: $ => seq(
      "{",
      field("arg",
        repeat(
          $.argument
        ),
      ),
      "}",
    ),

    argument: $ => seq(
      optional(
        seq(
          field("name",
            $.identifier
          ),
          token.immediate(":"),
        )
      ),
      field("value", choice(
          $.number,
          $.color
        )
      ),
    ),

    color: $ => seq(
      field("scheme",
        choice(
          "rgb",
          "rgba",
        ),
      ),
      token.immediate("("),
      field("channel",
        repeat1(
          $.number,
        )
      ),
      ")",
    ),

    identifier: _ => /[a-zA-Z][a-zA-Z0-9]*/,

    number: _ => /[+-]?([0-9]+\.?[0-9]*|\.[0-9]+)/,

    // http://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: _ => token(
      choice(
        /\/\/[^\r\n\u2028\u2029]*/,
        /\/\*[^*]*\*+([^/*][^*]*\*+)*\//,
      )
    ),
  }
});
