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

#[test]
fn external_changes_are_never_overwritten() {
    let directory = tempfile::tempdir().unwrap();
    let path = directory.path().join("AGENTS.md");
    fs::write(&path, "original").unwrap();
    let mut file = FileDocument::open(&path).unwrap();
    file.document.edit(0..8, "my changes").unwrap();
    fs::write(&path, "someone else's changes").unwrap();
    assert_eq!(
        file.save().unwrap_err().kind(),
        std::io::ErrorKind::AlreadyExists
    );
    assert_eq!(fs::read_to_string(&path).unwrap(), "someone else's changes");
    assert_eq!(file.document.source(), "my changes");
    assert_eq!(fs::read_dir(directory.path()).unwrap().count(), 1);
}

#[cfg(unix)]
#[test]
fn symlink_target_and_permissions_survive_saving() {
    use std::os::unix::fs::{PermissionsExt, symlink};
    let directory = tempfile::tempdir().unwrap();
    let target = directory.path().join("target.md");
    let link = directory.path().join("link.md");
    fs::write(&target, "old").unwrap();
    fs::set_permissions(&target, fs::Permissions::from_mode(0o640)).unwrap();
    symlink(&target, &link).unwrap();
    let mut file = FileDocument::open(&link).unwrap();
    file.document.edit(0..3, "new").unwrap();
    file.save().unwrap();
    assert!(fs::symlink_metadata(&link).unwrap().is_symlink());
    assert_eq!(fs::read_to_string(&target).unwrap(), "new");
    assert_eq!(
        fs::metadata(&target).unwrap().permissions().mode() & 0o777,
        0o640
    );
    let hardlink = directory.path().join("hard.md");
    fs::hard_link(&target, hardlink).unwrap();
    file.document.edit(0..3, "next").unwrap();
    assert_eq!(
        file.save().unwrap_err().kind(),
        std::io::ErrorKind::Unsupported
    );
    assert_eq!(fs::read_to_string(&target).unwrap(), "new");
}

#[test]
fn no_op_save_keeps_timestamps_and_bytes() {
    let directory = tempfile::tempdir().unwrap();
    for (i, source) in [
        "",
        "no final newline  ",
        "\u{feff}---\r\nkey: value\r\n---\r\n",
        "a\rb\nend\r\n",
    ]
    .iter()
    .enumerate()
    {
        let path = directory.path().join(format!("{i}.md"));
        fs::write(&path, source).unwrap();
        let before = fs::metadata(&path).unwrap().modified().unwrap();
        FileDocument::open(&path).unwrap().save().unwrap();
        assert_eq!(fs::read(&path).unwrap(), source.as_bytes());
        assert_eq!(fs::metadata(&path).unwrap().modified().unwrap(), before);
    }
}
