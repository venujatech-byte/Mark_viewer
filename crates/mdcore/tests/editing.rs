use mdcore::Document;

#[test]
fn byte_edit_changes_only_the_selected_text() {
    let source = "\u{feff}---\r\n# comment\r\nname: skill\r\n---\r\n\r\n# Old title  \r\nEnd";
    let mut document = Document::new(source.into());
    let start = source.find("Old").unwrap();
    document.edit(start..start + 3, "New").unwrap();
    assert_eq!(document.source(), source.replacen("Old", "New", 1));
    document
        .edit(document.source().len()..document.source().len(), "!")
        .unwrap();
    assert!(document.source().ends_with("End!"));
}

#[test]
fn invalid_ranges_never_mutate_the_document() {
    let mut document = Document::new("a🦀éz".into());
    let original = document.clone();
    for range in [
        2..3,
        1..2,
        7..99,
        std::ops::Range { start: 6, end: 5 },
        99..99,
    ] {
        assert_eq!(
            document.edit(range, "x").unwrap_err().kind(),
            std::io::ErrorKind::InvalidInput
        );
        assert_eq!(document, original);
    }
    document.edit(1..5, "界").unwrap();
    assert_eq!(document.source(), "a界éz");
    document.edit(0..document.source().len(), "").unwrap();
    assert_eq!(document.source(), "");
}
