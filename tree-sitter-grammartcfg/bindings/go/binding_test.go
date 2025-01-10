package tree_sitter_grammartcfg_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_grammartcfg "github.com/vojone/grammart/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_grammartcfg.Language())
	if language == nil {
		t.Errorf("Error loading GrammArtCFG grammar")
	}
}
