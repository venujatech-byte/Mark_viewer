use mdcore::FileDocument;
use std::fs;

#[test]
fn atomically_saves_only_edited_source_bytes() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("SKILL.md");
    let original = "\u{feff}---\r\n# keep\r\nname: skill\r\n---\r\n# Old  \r\nNo final newline";
    fs::write(&path, original).unwrap();
    let mut file = FileDocument::open(&path).unwrap();
    let start = original.find("Old").unwrap();
    file.document.edit(start..start + 3, "New").unwrap();
    file.save().unwrap();
    assert_eq!(
        fs::read_to_string(&path).unwrap(),
        original.replace("Old", "New")
    );
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
    file.save().unwrap();
}
