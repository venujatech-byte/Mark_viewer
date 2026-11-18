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

#[test]
fn raw_html_cannot_execute_or_create_host_controls() {
    let html = render(
        "<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\nHi <button>Save</button>",
    );
    assert!(!html.contains("<script>"));
    assert!(!html.contains("<img"));
    assert!(!html.contains("<button>"));
    assert!(html.contains("&lt;script&gt;"));
}

#[test]
fn unsafe_link_and_image_schemes_are_removed() {
    for url in [
        "javascript:alert",
        "vbscript:msgbox",
        "data:text/html,bad",
        "file:///etc/passwd",
        "//evil.test/x",
    ] {
        let html = render(&format!("[link]({url}) ![image]({url})"));
        assert!(!html.contains(url), "{html}");
    }
    for url in [
        "https://example.com",
        "./guide.md",
        "#heading",
        "mailto:a@example.com",
    ] {
        assert!(render(&format!("[link]({url})")).contains(url));
    }
    assert!(!mdcore::safe_url("https:\\evil.test", false));
    assert!(!mdcore::safe_url("java\nscript:alert", false));
}
