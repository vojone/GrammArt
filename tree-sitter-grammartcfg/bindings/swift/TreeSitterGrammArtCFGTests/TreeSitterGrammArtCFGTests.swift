import XCTest
import SwiftTreeSitter
import TreeSitterGrammArtCFG

final class TreeSitterGrammArtCFGTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_grammartcfg())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading GrammArtCFG grammar")
    }
}
