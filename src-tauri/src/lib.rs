#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::path::{Component, Path, PathBuf};

use base64::engine::general_purpose::STANDARD as BASE64_STANDARD;
use base64::Engine;
use serde::Serialize;
use sha2::{Digest, Sha256};
use tauri::Manager;

#[derive(Serialize)]
struct DeviceInfo {
    device_id: String,
}

#[tauri::command]
fn get_device_id() -> Result<DeviceInfo, String> {
    let machine = std::env::var("COMPUTERNAME").unwrap_or_else(|_| "unknown-machine".to_string());
    let user = std::env::var("USERNAME").unwrap_or_else(|_| "unknown-user".to_string());
    let os = std::env::consts::OS;
    let arch = std::env::consts::ARCH;

    let raw = format!("{machine}:{user}:{os}:{arch}");
    let mut hasher = Sha256::new();
    hasher.update(raw.as_bytes());
    let digest = hasher.finalize();
    let device_id = format!("{:x}", digest);

    Ok(DeviceInfo { device_id })
}

fn is_path_allowed(path: &Path, app: &tauri::AppHandle) -> bool {
    let mut allowed_roots: Vec<PathBuf> = Vec::new();

    if let Ok(download_dir) = app.path().download_dir() {
        allowed_roots.push(download_dir);
    }

    if let Ok(app_data_dir) = app.path().app_data_dir() {
        allowed_roots.push(app_data_dir);
    }

    allowed_roots
        .iter()
        .any(|root| path.starts_with(root))
}

fn contains_relative_segments(path: &Path) -> bool {
    path.components().any(|c| matches!(c, Component::ParentDir | Component::CurDir))
}

fn has_dangerous_extension(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    matches!(
        ext.as_str(),
        "exe" | "bat" | "cmd" | "com" | "ps1" | "vbs" | "js" | "msi" | "dll" | "scr"
    )
}

fn is_supported_export_extension(path: &Path) -> bool {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or_default()
        .to_ascii_lowercase();

    matches!(
        ext.as_str(),
        "csv" | "txt" | "md" | "xlsx" | "docx" | "png" | "jpg" | "jpeg" | "webp" | "gif" | "bmp"
    )
}

#[tauri::command]
fn save_file_to_path(
    app: tauri::AppHandle,
    path: String,
    content: String,
    is_base64: bool,
) -> Result<(), String> {
    let target = PathBuf::from(&path);
    if !target.is_absolute() {
        return Err("Path must be absolute".to_string());
    }

    if contains_relative_segments(&target) {
        return Err("Path must not contain relative segments".to_string());
    }

    if has_dangerous_extension(&target) {
        return Err("Refuse to write dangerous executable/script extension".to_string());
    }

    if !is_supported_export_extension(&target) {
        return Err("Unsupported export file extension".to_string());
    }

    if !is_path_allowed(&target, &app) {
        return Err("Target path is outside allowed directories".to_string());
    }

    if let Some(parent) = target.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("Create directory failed: {e}"))?;
    }

    let data = if is_base64 {
        BASE64_STANDARD
            .decode(content.as_bytes())
            .map_err(|e| format!("Invalid base64 content: {e}"))?
    } else {
        content.into_bytes()
    };

    // Keep command as a constrained export channel, not a general write primitive.
    const MAX_BYTES: usize = 50 * 1024 * 1024;
    if data.len() > MAX_BYTES {
        return Err("File content exceeds 50MB limit".to_string());
    }

    fs::write(&target, data).map_err(|e| format!("Write file failed: {e}"))?;
    Ok(())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .invoke_handler(tauri::generate_handler![get_device_id, save_file_to_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
