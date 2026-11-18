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
