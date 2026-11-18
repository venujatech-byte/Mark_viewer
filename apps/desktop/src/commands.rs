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

fn save_source(state: &ActiveDocument, path: &str, source: String) -> Result<(), String> {
    let mut guard = state.lock().map_err(|error| error.to_string())?;
    let file = guard.as_mut().ok_or("no document is open")?;
    if file.path().to_string_lossy() != path {
        return Err("the active document changed; reopen it before saving".into());
    }
    file.document = mdcore::Document::new(source);
    file.save().map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn save_document(
    state: tauri::State<'_, ActiveDocument>,
    path: String,
    source: String,
) -> Result<(), String> {
    save_source(&state, &path, source)
}

#[tauri::command]
pub async fn confirm_discard(app: tauri::AppHandle) -> bool {
    app.dialog()
        .message("This document has unsaved changes.")
        .title("Discard changes?")
        .buttons(tauri_plugin_dialog::MessageDialogButtons::OkCancelCustom(
            "Discard changes".into(),
            "Keep editing".into(),
        ))
        .blocking_show()
}

fn external_url(url: &str) -> Result<tauri::Url, String> {
    let parsed = tauri::Url::parse(url).map_err(|error| error.to_string())?;
    if !mdcore::safe_url(url, false) || !matches!(parsed.scheme(), "https" | "http" | "mailto") {
        return Err("unsupported external link".into());
    }
    Ok(parsed)
}

#[tauri::command]
pub fn open_external(app: tauri::AppHandle, url: String) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    let url = external_url(&url)?;
    app.opener()
        .open_url(url.as_str(), None::<&str>)
        .map_err(|error| error.to_string())
}

fn local_path(document: &Path, link: &str) -> Result<std::path::PathBuf, String> {
    if !mdcore::safe_url(link, true) {
        return Err("unsupported local resource URL".into());
    }
    let base = tauri::Url::from_file_path(document).map_err(|_| "invalid document path")?;
    let url = base.join(link).map_err(|error| error.to_string())?;
    let path = url
        .to_file_path()
        .map_err(|_| "expected a local resource")?;
    std::fs::canonicalize(path).map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn open_relative(
    state: tauri::State<'_, ActiveDocument>,
    url: String,
) -> Result<Option<OpenedDocument>, String> {
    let path = {
        let guard = state.lock().map_err(|error| error.to_string())?;
        local_path(guard.as_ref().ok_or("no document is open")?.path(), &url)?
    };
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !matches!(extension.as_str(), "md" | "markdown" | "mdown") {
        return Err("only markdown links can open in Mark".into());
    }
    read_document(&path, &state).map(Some)
}

fn image_bytes(document: &Path, url: &str) -> Result<Vec<u8>, String> {
    use std::io::Read;
    let path = local_path(document, url)?;
    let parent = document.parent().ok_or("document has no parent")?;
    let extension = path
        .extension()
        .and_then(|ext| ext.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !path.starts_with(parent)
        || !matches!(
            extension.as_str(),
            "png" | "jpg" | "jpeg" | "gif" | "webp" | "svg" | "avif" | "bmp"
        )
    {
        return Err("local images must be image files inside the document folder".into());
    }
    let metadata = std::fs::metadata(&path).map_err(|error| error.to_string())?;
    const LIMIT: u64 = 10 * 1024 * 1024;
    if !metadata.is_file() || metadata.len() > LIMIT {
        return Err("image must be a regular file no larger than 10 MiB".into());
    }
    let mut bytes = Vec::new();
    std::fs::File::open(path)
        .map_err(|error| error.to_string())?
        .take(LIMIT + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| error.to_string())?;
    if bytes.len() as u64 > LIMIT {
        return Err("image exceeds 10 MiB".into());
    }
    Ok(bytes)
}

#[tauri::command]
pub async fn read_image(
    state: tauri::State<'_, ActiveDocument>,
    url: String,
) -> Result<tauri::ipc::Response, String> {
    let guard = state.lock().map_err(|error| error.to_string())?;
    image_bytes(guard.as_ref().ok_or("no document is open")?.path(), &url)
        .map(tauri::ipc::Response::new)
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
        assert!(save_source(&state, "/wrong/path.md", "bad".into()).is_err());
        assert_eq!(
            state.lock().unwrap().as_ref().unwrap().document.source(),
            opened.source
        );
        assert!(opened.source.starts_with("---\nname:"));
        assert!(opened.html.contains("<h1>Release check</h1>"));
        assert!(opened.path.ends_with("SKILL.md"));
    }
    #[test]
    fn complete_edit_save_and_conflict_cycle_uses_the_selected_file() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("SKILL.md");
        let original = "\u{feff}---\r\n# keep\r\nname: skill\r\n---\r\n# Old  ";
        std::fs::write(&path, original).unwrap();
        let state = ActiveDocument::default();
        let opened = read_document(&path, &state).unwrap();
        let edited = edit_source(
            opened.source,
            mdcore::editor_source(original).replace("Old", "New"),
        );
        assert!(render_document(edited.clone()).contains("<h1>New</h1>"));
        save_source(&state, &opened.path, edited.clone()).unwrap();
        assert_eq!(
            std::fs::read_to_string(&path).unwrap(),
            original.replace("Old", "New")
        );
        std::fs::write(&path, "external changes").unwrap();
        assert!(save_source(&state, &opened.path, edited).is_err());
        assert_eq!(std::fs::read_to_string(&path).unwrap(), "external changes");
    }
    #[test]
    fn external_navigation_rejects_active_and_local_schemes() {
        for url in [
            "javascript:alert(1)",
            "file:///etc/passwd",
            "data:text/html,bad",
            "command:workbench.action",
            "./README.md",
        ] {
            assert!(external_url(url).is_err());
        }
        for url in [
            "https://example.com/a",
            "http://localhost:8080",
            "mailto:a@example.com",
        ] {
            assert!(external_url(url).is_ok());
        }
    }
    #[test]
    fn local_links_resolve_from_the_document_including_encoded_names() {
        let path = Path::new(env!("CARGO_MANIFEST_DIR"))
            .join("../../crates/mdcore/tests/fixtures/AGENTS.md")
            .canonicalize()
            .unwrap();
        assert!(
            local_path(&path, "./SKILL%2Emd#release")
                .unwrap()
                .ends_with("SKILL.md")
        );
        for link in [
            "https://example.com",
            "file:///etc/passwd",
            "//remote/path",
            "javascript:alert(1)",
        ] {
            assert!(local_path(&path, link).is_err());
        }
    }
    #[test]
    fn image_reads_are_bounded_to_the_selected_document_folder() {
        let dir = tempfile::tempdir().unwrap();
        let folder = dir.path().join("docs");
        std::fs::create_dir(&folder).unwrap();
        let document = folder.join("README.md");
        std::fs::write(&document, "text").unwrap();
        std::fs::write(folder.join("image.png"), [1, 2, 3]).unwrap();
        std::fs::write(dir.path().join("private.png"), [4, 5]).unwrap();
        assert_eq!(image_bytes(&document, "./image.png").unwrap(), [1, 2, 3]);
        assert!(image_bytes(&document, "../private.png").is_err());
        assert!(image_bytes(&document, "README.md").is_err());
        let oversized = std::fs::File::create(folder.join("large.png")).unwrap();
        oversized.set_len(10 * 1024 * 1024 + 1).unwrap();
        assert!(image_bytes(&document, "large.png").is_err());
    }
    #[cfg(unix)]
    #[test]
    fn encoded_traversal_and_symlinks_cannot_escape_image_scope() {
        let dir = tempfile::tempdir().unwrap();
        let folder = dir.path().join("docs");
        std::fs::create_dir(&folder).unwrap();
        let document = folder.join("README.md");
        let private = dir.path().join("private.png");
        std::fs::write(&document, "text").unwrap();
        std::fs::write(&private, "private bytes").unwrap();
        std::os::unix::fs::symlink(&private, folder.join("link.png")).unwrap();
        for url in [
            "link.png",
            "..%2Fprivate.png",
            "../private.png",
            "file:///etc/passwd",
        ] {
            assert!(image_bytes(&document, url).is_err(), "{url}");
        }
    }
}
