use mdcore::{FileDocument, render};
use serde::Serialize;
use std::path::Path;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
pub struct OpenedDocument {
    path: String,
    source: String,
    html: String,
}

fn read_document(path: &Path) -> Result<OpenedDocument, String> {
    let file = FileDocument::open(path).map_err(|error| error.to_string())?;
    Ok(OpenedDocument {
        path: file.path().to_string_lossy().into_owned(),
        source: file.document.source().into(),
        html: render(file.document.source()),
    })
}

#[tauri::command]
pub async fn open_document(app: tauri::AppHandle) -> Result<Option<OpenedDocument>, String> {
    let Some(selected) = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    read_document(&path).map(Some)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_and_renders_a_selected_instruction_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../crates/mdcore/tests/fixtures/SKILL.md");
        let opened = read_document(&path).unwrap();
        assert!(opened.source.starts_with("---\nname:"));
        assert!(opened.html.contains("<h1>Release check</h1>"));
        assert!(opened.path.ends_with("SKILL.md"));
    }
}
