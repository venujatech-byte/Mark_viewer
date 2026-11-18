#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(commands::ActiveDocument::default())
        .invoke_handler(tauri::generate_handler![
            commands::open_document,
            commands::edit_source,
            commands::render_document
        ])
        .run(tauri::generate_context!())
        .expect("could not start Mark");
}
