use mdcore::{FileDocument, render};
use serde::Serialize;
use std::{path::Path, sync::Mutex};

pub type ActiveDocument = Mutex<Option<FileDocument>>;
use tauri_plugin_dialog::DialogExt;

#[derive(Serialize)]
pub struct OpenedDocument {
    path: String,
    source: String,
    html: String,
}

fn read_document(path: &Path, state: &ActiveDocument) -> Result<OpenedDocument, String> {
    let file = FileDocument::open(path).map_err(|error| error.to_string())?;
    let opened = OpenedDocument {
        path: file.path().to_string_lossy().into_owned(),
        source: file.document.source().into(),
        html: render(file.document.source()),
    };
    *state.lock().map_err(|error| error.to_string())? = Some(file);
    Ok(opened)
}

#[tauri::command]
pub async fn open_document(
    app: tauri::AppHandle,
    state: tauri::State<'_, ActiveDocument>,
) -> Result<Option<OpenedDocument>, String> {
    let Some(selected) = app
        .dialog()
        .file()
        .add_filter("Markdown", &["md", "markdown", "mdown"])
        .blocking_pick_file()
    else {
        return Ok(None);
    };
    let path = selected.into_path().map_err(|error| error.to_string())?;
    read_document(&path, &state).map(Some)
}

#[tauri::command]
pub fn edit_source(source: String, updated: String) -> String {
    mdcore::apply_editor_text(&source, &updated)
}

#[tauri::command]
pub fn render_document(source: String) -> String {
    render(&source)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_and_renders_a_selected_instruction_file() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../crates/mdcore/tests/fixtures/SKILL.md");
        let state = ActiveDocument::default();
        let opened = read_document(&path, &state).unwrap();
        assert!(read_document(Path::new("/missing/mark.md"), &state).is_err());
        assert_eq!(
            state.lock().unwrap().as_ref().unwrap().document.source(),
            opened.source
        );
        assert!(opened.source.starts_with("---\nname:"));
        assert!(opened.html.contains("<h1>Release check</h1>"));
        assert!(opened.path.ends_with("SKILL.md"));
    }
}
