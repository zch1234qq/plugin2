use uuid::Uuid;
use std::path::PathBuf;

fn main() {
  let app_data_dir = tauri::path::app_data_dir(tauri::Config::default()).expect("无法获取应用数据目录");
  
  println!("应用数据目录: {:?}", app_data_dir);
  
  let id = Uuid::new_v4();
  println!("生成的UUID: {}", id);

  let fallback_path = PathBuf::from(".");
  let dir = app_data_dir.parent().unwrap_or(&fallback_path);
} 