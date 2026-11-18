use mdcore::{Document, render, split_frontmatter};

#[test]
fn bom_crlf_empty_and_yaml_end_delimiters_are_supported() {
    for source in [
        "\u{feff}---\r\nname: café\r\n---\r\n# Body",
        "---\n---\n# Body",
        "---\na: b\n...\n# Body",
        "---\na: b\n---",
    ] {
        let document = Document::new(source.into());
        assert!(split_frontmatter(source).0.is_some());
        assert!(!render(source).contains("<hr"));
        assert_eq!(document.source(), source);
    }
}

#[test]
fn unclosed_or_noninitial_delimiters_are_not_frontmatter() {
    for source in [
        "---\nname: skill\n# Editing",
        "\n---\nname: skill\n---",
        "paragraph\n---",
        "---",
        "",
    ] {
        assert!(split_frontmatter(source).0.is_none(), "{source:?}");
    }
    assert_eq!(render("\u{feff}# Body"), "<h1>Body</h1>\n");
}
