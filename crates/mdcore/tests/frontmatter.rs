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

#[test]
fn legacy_and_mixed_newlines_keep_metadata_boundaries_exact() {
    for source in [
        "---\ra: b\r---\r# Body",
        "---\r\na: b\r---\n# Body",
        "---\nkey: value\r\n...\r# Body",
    ] {
        let (metadata, body) = split_frontmatter(source);
        assert!(metadata.is_some());
        assert_eq!(body, "# Body");
        assert!(source.contains(metadata.unwrap()));
    }
}
