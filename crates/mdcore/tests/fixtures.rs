use mdcore::{Document, render};
use std::path::Path;

#[test]
fn reads_realistic_instruction_files_exactly() {
    for name in ["AGENTS.md", "SKILL.md", "README.md"] {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("tests/fixtures")
            .join(name);
        let document = Document::read(&path).unwrap();
        assert_eq!(document.source().as_bytes(), std::fs::read(path).unwrap());
        assert!(render(document.source()).contains("<h1>"));
    }
}
