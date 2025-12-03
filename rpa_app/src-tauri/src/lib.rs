use std::fs;
use std::process::Command;
use std::time::Duration;
use chrono::{Local, TimeZone};
use tauri::menu::{Menu, MenuItem, Submenu};
use tauri::{Manager, Emitter};
use tauri_plugin_dialog::DialogExt;
use serde::{Deserialize, Serialize};

#[tauri::command]
fn save_note(app_handle: tauri::AppHandle, content: String) -> Result<String, String> {
    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("警告：无法获取应用数据目录: {}，使用当前目录", e);
            std::env::current_dir().map_err(|e| format!("无法获取当前目录: {}", e))?
        }
    };
    
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("无法创建目录: {}", e))?;
    
    let file_path = app_data_dir.join("spider_config.json");
    
    match fs::write(&file_path, content) {
        Ok(_) => Ok("配置保存成功".to_string()),
        Err(e) => Err(format!("保存文件失败: {}", e)),
    }
}

#[tauri::command]
fn load_note(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("警告：无法获取应用数据目录: {}，使用当前目录", e);
            std::env::current_dir().map_err(|e| format!("无法获取当前目录: {}", e))?
        }
    };
    
    let file_path = app_data_dir.join("spider_config.json");
    
    match fs::read_to_string(&file_path) {
        Ok(content) => Ok(content),
        Err(_) => Ok(String::new()),
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SpiderParams {
    pub page: i32,
    pub title: String,
    pub project_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SpiderConfig {
    pub params: SpiderParams,
    pub email: String,
    pub year: u32,
    pub month: u32,
    pub day: u32,
    pub hour: u32,
    pub minute: u32,
    pub second: u32,
    pub enabled: bool,
    #[serde(default)]
    pub push_content_enabled: bool,
    #[serde(default)]
    pub push_content: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SmtpConfig {
    pub server: String,
    pub port: u16,
    pub username: String,
    pub password: String,
}

#[tauri::command]
fn save_smtp_config(app_handle: tauri::AppHandle, config: SmtpConfig) -> Result<String, String> {
    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("警告：无法获取应用数据目录: {}，使用当前目录", e);
            std::env::current_dir().map_err(|e| format!("无法获取当前目录: {}", e))?
        }
    };
    
    fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("无法创建目录: {}", e))?;
    
    let file_path = app_data_dir.join("smtp_config.json");
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化配置失败: {}", e))?;
    
    match fs::write(&file_path, config_json) {
        Ok(_) => Ok("SMTP 配置保存成功".to_string()),
        Err(e) => Err(format!("保存文件失败: {}", e))
    }
}

#[tauri::command]
fn load_smtp_config(app_handle: tauri::AppHandle) -> Result<SmtpConfig, String> {
    let app_data_dir = match app_handle.path().app_data_dir() {
        Ok(dir) => dir,
        Err(e) => {
            eprintln!("警告：无法获取应用数据目录: {}，使用当前目录", e);
            std::env::current_dir().map_err(|e| format!("无法获取当前目录: {}", e))?
        }
    };
    
    let file_path = app_data_dir.join("smtp_config.json");
    
    match fs::read_to_string(&file_path) {
        Ok(content) => {
            serde_json::from_str::<SmtpConfig>(&content)
                .map_err(|e| format!("解析配置失败: {}", e))
        }
        Err(_) => {
            // 返回默认的QQ邮箱配置
            Ok(SmtpConfig {
                server: "smtp.qq.com".to_string(),
                port: 587,
                username: "".to_string(),
                password: "".to_string(),
            })
        }
    }
}

fn get_smtp_config(app_handle: &tauri::AppHandle) -> SmtpConfig {
    // 首先尝试从配置文件读取
    match load_smtp_config(app_handle.clone()) {
        Ok(config) => {
            // 如果配置完整，直接返回
            if !config.username.is_empty() && !config.password.is_empty() {
                return config;
            }
            // 即使不完整，也使用配置文件中的服务器和端口，只从环境变量获取用户名和密码
            let smtp_username = std::env::var("SMTP_USERNAME")
                .unwrap_or_else(|_| config.username.clone());
            let smtp_password = std::env::var("SMTP_PASSWORD")
                .unwrap_or_else(|_| config.password.clone());
            
            if !smtp_username.is_empty() && !smtp_password.is_empty() {
                return SmtpConfig {
                    server: config.server,
                    port: config.port,
                    username: smtp_username,
                    password: smtp_password,
                };
            }
            return config;
        }
        Err(_) => {}
    }
    
    // 如果配置文件不存在或加载失败，尝试从环境变量读取
    let smtp_server = std::env::var("SMTP_SERVER")
        .unwrap_or_else(|_| "smtp.qq.com".to_string());
    let smtp_port = std::env::var("SMTP_PORT")
        .unwrap_or_else(|_| "587".to_string())
        .parse::<u16>()
        .unwrap_or(587);
    let smtp_username = std::env::var("SMTP_USERNAME")
        .unwrap_or_else(|_| "".to_string());
    let smtp_password = std::env::var("SMTP_PASSWORD")
        .unwrap_or_else(|_| "".to_string());
    
    SmtpConfig {
        server: smtp_server,
        port: smtp_port,
        username: smtp_username,
        password: smtp_password,
    }
}

// 缓存 Python 和脚本路径，避免每次都查找
static mut CACHED_PYTHON: Option<String> = None;
static mut CACHED_SCRIPT: Option<std::path::PathBuf> = None;
static mut CACHED_BIN_PATH: Option<std::path::PathBuf> = None;
static mut PATH_INITIALIZED: bool = false;

fn find_python() -> Option<String> {
    unsafe {
        if let Some(ref python) = CACHED_PYTHON {
            // 验证 Python 是否仍然可用
            if Command::new(python).arg("--version").output().is_ok() {
                return Some(python.clone());
            }
        }
    }
    
    // 尝试常见的 Python 路径
    let python_candidates = vec!["python3", "python"];
    for python in python_candidates {
        if Command::new(python).arg("--version").output().is_ok() {
            unsafe {
                CACHED_PYTHON = Some(python.to_string());
            }
            return Some(python.to_string());
        }
    }
    
    None
}

fn find_spider_script(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    unsafe {
        if PATH_INITIALIZED {
            if let Some(ref path) = CACHED_SCRIPT {
                if path.exists() {
                    return Ok(path.clone());
                }
            }
        }
    }
    
    let mut script_path = std::path::PathBuf::new();
    let mut found = false;
    
    // 1. 优先从应用资源目录查找（打包后的应用使用此路径）
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let test_path = resource_dir.join("spiders.py");
        if test_path.exists() {
            script_path = test_path;
            found = true;
        }
    }
    
    // 2. 从当前工作目录向上查找（开发环境使用）
    if !found {
        if let Ok(mut search_dir) = std::env::current_dir() {
            for _ in 0..5 {
                let test_path = search_dir.join("中国石油招标投标网").join("spiders.py");
                if test_path.exists() {
                    script_path = test_path;
                    found = true;
                    break;
                }
                if let Some(parent) = search_dir.parent() {
                    search_dir = parent.to_path_buf();
                } else {
                    break;
                }
            }
        }
    }
    
    if !found || !script_path.exists() {
        return Err("Python 脚本不存在".to_string());
    }
    
    unsafe {
        CACHED_SCRIPT = Some(script_path.clone());
        PATH_INITIALIZED = true;
    }
    
    Ok(script_path)
}

fn find_spider_bin(app_handle: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    unsafe {
        if PATH_INITIALIZED {
            if let Some(ref path) = CACHED_BIN_PATH {
                if path.exists() {
                    return Ok(path.clone());
                }
            }
        }
    }
    
    let mut bin_path = std::path::PathBuf::new();
    let mut found = false;
    
    // 1. 优先从应用资源目录查找（打包后的应用使用此路径）
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        // onedir 模式：可执行文件在 bin/spider_bin/spider_bin
        let test_path = resource_dir.join("bin").join("spider_bin").join("spider_bin");
        if test_path.exists() {
            bin_path = test_path;
            found = true;
        } else {
            // 兼容旧版本：单个文件在 bin/spider_bin
            let test_path_old = resource_dir.join("bin").join("spider_bin");
            if test_path_old.exists() && test_path_old.is_file() {
                bin_path = test_path_old;
                found = true;
            }
        }
    }
    
    // 2. 从当前工作目录向上查找（开发环境使用）
    if !found {
        if let Ok(mut search_dir) = std::env::current_dir() {
            for _ in 0..5 {
                // onedir 模式：目录在 dist/spider_bin/spider_bin
                let test_path = search_dir.join("中国石油招标投标网").join("dist").join("spider_bin").join("spider_bin");
                if test_path.exists() {
                    bin_path = test_path;
                    found = true;
                    break;
                }
                // 兼容旧版本：单个文件
                let test_path_old = search_dir.join("中国石油招标投标网").join("dist").join("spider_bin");
                if test_path_old.exists() && test_path_old.is_file() {
                    bin_path = test_path_old;
                    found = true;
                    break;
                }
                if let Some(parent) = search_dir.parent() {
                    search_dir = parent.to_path_buf();
                } else {
                    break;
                }
            }
        }
    }
    
    // 3. 从可执行文件目录向上查找
    if !found {
        if let Ok(exe_path) = std::env::current_exe() {
            if let Some(exe_dir) = exe_path.parent() {
                let mut search_dir = exe_dir.to_path_buf();
                for _ in 0..5 {
                    let test_path = search_dir.join("中国石油招标投标网").join("dist").join("spider_bin").join("spider_bin");
                    if test_path.exists() {
                        bin_path = test_path;
                        found = true;
                        break;
                    }
                    let test_path_old = search_dir.join("中国石油招标投标网").join("dist").join("spider_bin");
                    if test_path_old.exists() && test_path_old.is_file() {
                        bin_path = test_path_old;
                        found = true;
                        break;
                    }
                    if let Some(parent) = search_dir.parent() {
                        search_dir = parent.to_path_buf();
                    } else {
                        break;
                    }
                }
            }
        }
    }
    
    if !found || !bin_path.exists() {
        let resource_path = app_handle.path().resource_dir()
            .map(|p| p.join("bin").join("spider_bin").join("spider_bin"))
            .unwrap_or_default();
        return Err(format!(
            "爬虫可执行文件不存在。\n已搜索路径:\n- 资源目录: {:?}\n- 当前工作目录: {:?}",
            resource_path,
            std::env::current_dir().unwrap_or_default()
        ));
    }
    
    // 缓存路径
    unsafe {
        CACHED_BIN_PATH = Some(bin_path.clone());
    }
    
    Ok(bin_path)
}

fn run_spider_internal(app_handle: &tauri::AppHandle, params: SpiderParams) -> Result<String, String> {
    let params_json = serde_json::to_string(&params)
        .map_err(|e| format!("序列化参数失败: {}", e))?;
    
    // 优先使用系统 Python 运行脚本（速度快，1-3秒）
    if let Some(python) = find_python() {
        if let Ok(script_path) = find_spider_script(app_handle) {
            let script_dir = script_path.parent().ok_or("无法获取脚本目录")?;
            let output = Command::new(&python)
                .arg(&script_path)
                .arg(&params_json)
                .current_dir(script_dir)
                .output();
            
            match output {
                Ok(output) if output.status.success() => {
                    let result = String::from_utf8(output.stdout)
                        .map_err(|e| format!("解析输出失败: {}", e))?;
                    return Ok(result);
                }
                Ok(output) => {
                    let error = String::from_utf8(output.stderr)
                        .unwrap_or_else(|_| "未知错误".to_string());
                    // Python 执行失败，继续尝试使用打包的二进制文件
                    eprintln!("[爬虫] Python 执行失败，尝试使用打包版本: {}", error);
                }
                Err(_) => {
                    // Python 不可用，继续尝试使用打包的二进制文件
                }
            }
        }
    }
    
    // 回退到使用打包的二进制文件
    let bin_path = find_spider_bin(app_handle)?;
    let output = Command::new(&bin_path)
        .arg(&params_json)
        .output()
        .map_err(|e| format!("执行爬虫程序失败: {}", e))?;
    
    if output.status.success() {
        let result = String::from_utf8(output.stdout)
            .map_err(|e| format!("解析输出失败: {}", e))?;
        Ok(result)
    } else {
        let error = String::from_utf8(output.stderr)
            .unwrap_or_else(|_| "未知错误".to_string());
        Err(format!("爬虫执行失败: {}", error))
    }
}

#[tauri::command]
async fn send_email(app_handle: tauri::AppHandle, to: String, subject: String, body: String) -> Result<String, String> {
    // 在后台线程执行邮件发送，避免阻塞主线程
    let app_handle_clone = app_handle.clone();
    let result = tokio::task::spawn_blocking(move || {
        send_email_internal(app_handle_clone, to, subject, body)
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("邮件发送任务执行失败: {}", e)),
    }
}

fn send_email_internal(app_handle: tauri::AppHandle, to: String, subject: String, body: String) -> Result<String, String> {
    use lettre::message::header::ContentType;
    use lettre::transport::smtp::authentication::Credentials;
    use lettre::{Message, SmtpTransport, Transport};
    
    let smtp_config = get_smtp_config(&app_handle);
    let smtp_server = smtp_config.server;
    let smtp_port = smtp_config.port;
    let smtp_username = smtp_config.username;
    let smtp_password = smtp_config.password;
    
    // 强制要求配置 SMTP，不依赖系统邮件客户端（系统邮件客户端不可靠）
    if smtp_username.is_empty() || smtp_password.is_empty() {
        println!("[邮件] ❌ SMTP 未配置");
        return Err(format!(
            "邮件发送失败: 请先配置 SMTP 服务器。\n\n配置步骤：\n1. 在应用界面填写 SMTP 配置\n   - 服务器: smtp.qq.com\n   - 端口: 587\n   - 用户名: 您的QQ邮箱（如: 1220484430@qq.com）\n   - 密码: QQ邮箱授权码（不是登录密码）\n2. 点击'保存 SMTP 配置'按钮\n3. 重新执行任务\n\n获取QQ邮箱授权码：\n1. 登录QQ邮箱网页版\n2. 设置 -> 账户 -> 开启SMTP服务\n3. 生成授权码并复制"
        ));
    }
    
    // 使用 SMTP 发送邮件
    let from_address = if smtp_username.contains('@') {
        format!("RPA App <{}>", smtp_username)
    } else {
        format!("RPA App <{}@qq.com>", smtp_username)
    };
    
    // 验证邮箱地址格式
    if !to.contains('@') || !to.contains('.') {
        return Err(format!("邮箱地址格式不正确: {}. 请检查邮箱地址是否正确（例如: user@example.com）", to));
    }
    
    if to.contains("@gamil.com") {
        return Err(format!("邮箱地址可能有拼写错误: {}. 应该是 @gmail.com 而不是 @gamil.com", to));
    }
    
    let email = Message::builder()
        .from(from_address.parse().map_err(|e| format!("无效的发件人地址: {}", e))?)
        .to(to.parse().map_err(|e| {
            if to.contains("@gamil.com") {
                format!("无效的收件人地址: {}. 提示：应该是 @gmail.com 而不是 @gamil.com", to)
            } else {
                format!("无效的收件人地址: {}", e)
            }
        })?)
        .subject(&subject)
        .header(ContentType::TEXT_PLAIN)
        .body(body.clone())
        .map_err(|e| format!("创建邮件失败: {}", e))?;
    
    let creds = Credentials::new(smtp_username.clone(), smtp_password.clone());
    
    // 对于QQ邮箱，使用STARTTLS
    let mailer = if smtp_server.contains("qq.com") || smtp_port == 587 {
        SmtpTransport::starttls_relay(&smtp_server)
            .map_err(|e| format!("创建 STARTTLS 连接失败: {}", e))?
            .port(smtp_port)
            .credentials(creds)
            .build()
    } else {
        SmtpTransport::relay(&smtp_server)
            .map_err(|e| format!("连接 SMTP 服务器失败: {}", e))?
            .port(smtp_port)
            .credentials(creds)
            .build()
    };
    
    match mailer.send(&email) {
        Ok(_) => Ok(format!("邮件已成功发送到: {}", to)),
        Err(e) => {
            let error_msg = format!("邮件发送失败: {}", e);
            let detailed_error = if error_msg.contains("authentication") {
                format!("{}\n\n提示：请检查邮箱账号和授权码是否正确", error_msg)
            } else if error_msg.contains("connection") {
                format!("{}\n\n提示：请检查 SMTP 服务器地址和端口是否正确", error_msg)
            } else {
                error_msg
            };
            Err(detailed_error)
        }
    }
}

#[tauri::command]
async fn start_scheduled_spider(app_handle: tauri::AppHandle, config: SpiderConfig) -> Result<String, String> {
    if config.month < 1 || config.month > 12 {
        return Err("月份必须在 1-12 之间".to_string());
    }
    if config.day < 1 || config.day > 31 {
        return Err("日期必须在 1-31 之间".to_string());
    }
    if config.hour > 23 {
        return Err("小时必须在 0-23 之间".to_string());
    }
    if config.minute > 59 {
        return Err("分钟必须在 0-59 之间".to_string());
    }
    if config.second > 59 {
        return Err("秒必须在 0-59 之间".to_string());
    }
    
    let now = Local::now();
    let target_date = chrono::NaiveDate::from_ymd_opt(config.year as i32, config.month, config.day)
        .ok_or("无效的日期")?;
    let target_time = chrono::NaiveTime::from_hms_opt(config.hour, config.minute, config.second)
        .ok_or("无效的时间")?;
    let target_datetime = target_date.and_time(target_time);
    let next_run = Local.from_local_datetime(&target_datetime)
        .single()
        .ok_or("无法创建目标时间")?;
    
    if next_run <= now {
        return Err(format!("执行时间 {} 已过，请选择未来的时间", next_run.format("%Y-%m-%d %H:%M:%S")));
    }
    
    let wait_seconds = (next_run - now).num_seconds() as u64;
    
    println!("[定时任务] 任务已启动");
    println!("[定时任务] 当前时间: {}", now.format("%Y-%m-%d %H:%M:%S"));
    println!("[定时任务] 执行时间: {}", next_run.format("%Y-%m-%d %H:%M:%S"));
    println!("[定时任务] 等待时间: {} 秒 ({} 分钟)", wait_seconds, wait_seconds / 60);
    
    let params = config.params.clone();
    let email = config.email.clone();
    let push_content = config.push_content.clone();
    let push_content_enabled = config.push_content_enabled;
    
    println!("[定时任务] ========== 准备启动定时任务 ==========");
    println!("[定时任务] 参数: page={}, title={}, project_type={}", 
             params.page, params.title, params.project_type);
    println!("[定时任务] 邮箱: {}", email);
    println!("[定时任务] 执行时间: {}", next_run.format("%Y-%m-%d %H:%M:%S"));
    
    let app_handle_clone = app_handle.clone();
    
    tokio::spawn(async move {
        println!("[定时任务] ✅ 后台任务已成功启动！");
        println!("[定时任务] 等待 {} 秒后执行 ({} 分钟)", wait_seconds, wait_seconds / 60);
        
        tokio::time::sleep(Duration::from_secs(wait_seconds)).await;
        
        println!("[定时任务] ⏰ 到达执行时间，开始执行爬虫任务");
        
        let exec_time = Local::now();
        println!("[定时任务] 🚀 开始执行任务 - {}", exec_time.format("%Y-%m-%d %H:%M:%S"));
        
        let params_clone = params.clone();
        let email_clone = email.clone();
        let push_content_clone = push_content.clone();
        let push_content_enabled_clone = push_content_enabled;
        let app_handle_for_spider = app_handle_clone.clone();
        
        let result = tokio::task::spawn_blocking(move || {
            println!("[定时任务] 正在执行 Python 脚本...");
            run_spider_internal(&app_handle_for_spider, params_clone)
        }).await.unwrap_or_else(|e| {
            println!("[定时任务] ❌ 任务执行失败: {}", e);
            Err(format!("任务执行失败: {}", e))
        });
        
        match &result {
            Ok(data) => {
                println!("[定时任务] ✅ 执行成功，结果长度: {} 字符", data.len());
                if data.len() > 200 {
                    println!("[定时任务] 结果预览: {}...", &data[..200]);
                } else {
                    println!("[定时任务] 结果: {}", data);
                }
                let _ = app_handle_clone.emit("scheduled-task-result", data.clone());
            },
            Err(e) => {
                println!("[定时任务] ❌ 执行失败: {}", e);
                let _ = app_handle_clone.emit("scheduled-task-error", e.clone());
            }
        }
        
        // 如果有邮箱地址，就发送邮件（无论是否启用推送内容）
        if !email_clone.is_empty() {
            println!("[定时任务] 📧 准备发送邮件到: {}", email_clone);
            println!("[定时任务] 推送内容启用状态: {}", push_content_enabled_clone);
            println!("[定时任务] 推送内容: {}", if push_content_clone.is_empty() { "(空)" } else { "已设置" });
            
            let subject = "爬虫任务执行结果".to_string();
            
            let body = match &result {
                Ok(data) => {
                    let mut parts = Vec::new();
                    
                    // 如果启用了推送内容且有内容，先添加推送内容
                    if push_content_enabled_clone && !push_content_clone.is_empty() {
                        parts.push(push_content_clone.clone());
                    }
                    
                    // 添加执行结果
                    parts.push(format!("爬虫执行成功：\n{}", data));
                    
                    parts.join("\n\n")
                },
                Err(e) => {
                    let mut parts = Vec::new();
                    
                    // 如果启用了推送内容且有内容，先添加推送内容
                    if push_content_enabled_clone && !push_content_clone.is_empty() {
                        parts.push(push_content_clone.clone());
                    }
                    
                    // 添加错误信息
                    parts.push(format!("爬虫执行失败：\n{}", e));
                    
                    parts.join("\n\n")
                },
            };
            
            let email_for_send = email_clone.clone();
            let subject_clone = subject.clone();
            let body_clone = body.clone();
            let app_handle_for_email = app_handle_clone.clone();
            
            // 同步发送邮件，确保错误能被捕获
            let email_result = tokio::task::spawn_blocking(move || {
                send_email_internal(app_handle_for_email, email_for_send.clone(), subject_clone.clone(), body_clone.clone())
            }).await;
            
            match email_result {
                Ok(Ok(msg)) => {
                    let _ = app_handle_clone.emit("email-sent", msg);
                }
                Ok(Err(e)) => {
                    let error_msg = format!("邮件发送失败: {}", e);
                    let _ = app_handle_clone.emit("email-error", error_msg.clone());
                    let _ = app_handle_clone.emit("scheduled-task-error", error_msg);
                }
                Err(e) => {
                    let error_msg = format!("邮件发送任务执行失败: {}", e);
                    let _ = app_handle_clone.emit("email-error", error_msg.clone());
                    let _ = app_handle_clone.emit("scheduled-task-error", error_msg);
                }
            }
        }
    });
    
    Ok(format!(
        "定时任务已启动：将在 {} 执行，结果将发送到 {}",
        next_run.format("%Y-%m-%d %H:%M:%S"), config.email
    ))
}

#[tauri::command]
async fn run_spider(app_handle: tauri::AppHandle, params: SpiderParams) -> Result<String, String> {
    // 在后台线程执行，避免阻塞主线程导致 UI 卡死
    let result = tokio::task::spawn_blocking(move || {
        run_spider_internal(&app_handle, params)
    }).await;
    
    match result {
        Ok(res) => res,
        Err(e) => Err(format!("任务执行失败: {}", e)),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .menu(|app| {
            let about = MenuItem::with_id(app, "about", "关于本应用", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
            let app_submenu = Submenu::with_items(app, "应用", true, &[&about, &quit])?;
            Menu::with_items(app, &[&app_submenu])
        })
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .on_menu_event(|app, event| {
            let id = event.id();
            match id.as_ref() {
                "quit" => {
                    if let Some(window) = app.get_webview_window("main") {
                        window.close().unwrap();
                    }
                }
                "about" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let dialog = window.dialog().clone();
                        tauri_plugin_dialog::MessageDialogBuilder::new(
                            dialog,
                            "关于",
                            "这是我的 Tauri 学习项目 demo：\n- Vue + TypeScript 前端\n- Rust 后端\n- 支持文件读写 / 系统菜单 / 通知"
                        )
                        .show(|_| {});
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![
            save_note,
            load_note,
            run_spider,
            send_email,
            start_scheduled_spider,
            save_smtp_config,
            load_smtp_config
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
