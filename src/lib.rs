#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub fn run() {
    let context = tauri::generate_context!("../src-tauri/tauri.conf.json");
    tauri::Builder::default()
        .setup(|_app| {
            #[cfg(desktop)]
            _app.handle().plugin(tauri_plugin_updater::Builder::new().build());
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}