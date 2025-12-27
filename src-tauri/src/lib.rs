use enigo::{Enigo, Keyboard, Settings, Direction, Key};

#[tauri::command]
fn trigger_paste() {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    
    #[cfg(target_os = "macos")]
    let modifier = Key::Meta; // Command Key
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control; // Ctrl Key

    // Perform the Ctrl + V sequence
    let _ = enigo.key(modifier, Direction::Press);
    let _ = enigo.key(Key::Unicode('v'), Direction::Click);
    let _ = enigo.key(modifier, Direction::Release);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![trigger_paste])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}