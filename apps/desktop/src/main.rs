#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_opener::Builder::new()
                .open_js_links_on_click(false)
                .build(),
        )
        .manage(commands::ActiveDocument::default())
        .invoke_handler(tauri::generate_handler![
            commands::open_document,
            commands::edit_source,
            commands::render_document,
            commands::save_document,
            commands::confirm_discard,
            commands::open_external,
            commands::open_relative,
            commands::read_image
        ])
        .build(tauri::generate_context!())
        .expect("could not start Mark")
        .run(|app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event
                && let Some(window) = app.get_webview_window("main")
            {
                api.prevent_exit();
                if let Err(error) = window.close() {
                    eprintln!("could not request a safe close: {error}");
                }
            }
        });
}
