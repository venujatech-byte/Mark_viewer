use mdcore::render;

#[test]
fn commonmark_blocks_and_inline_markup_render_semantically() {
    let html = render(
        "**strong** and *emphasis* with `code`\n\n- first\n- second\n\n> quote\n\n1. one\n2. two\n",
    );
    for expected in [
        "<strong>strong</strong>",
        "<em>emphasis</em>",
        "<code>code</code>",
        "<ul>",
        "<ol>",
        "<li>first</li>",
        "<blockquote>",
    ] {
        assert!(html.contains(expected), "missing {expected}: {html}");
    }
}

#[test]
fn empty_and_unicode_documents_render_without_loss() {
    assert_eq!(render(""), "");
    assert_eq!(
        render("# සිංහල café 日本語 🦀"),
        "<h1>සිංහල café 日本語 🦀</h1>\n"
    );
    assert_eq!(render("a & b < c"), "<p>a &amp; b &lt; c</p>\n");
}
