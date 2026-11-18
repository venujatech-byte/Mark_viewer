use wasm_bindgen::prelude::*;

#[wasm_bindgen(js_name = render)]
pub fn render(source: &str) -> String {
    crate::render(source)
}

#[wasm_bindgen(js_name = editorSource)]
pub fn editor_source(source: &str) -> String {
    crate::editor_source(source)
}

#[wasm_bindgen(js_name = applyEditorText)]
pub fn apply_editor_text(source: &str, updated: &str) -> String {
    crate::apply_editor_text(source, updated)
}
