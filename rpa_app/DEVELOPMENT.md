# 开发文档

## 项目概述

这是一个基于 Tauri v2 的桌面应用程序，用于执行中国石油招标投标网的爬虫任务。应用使用 Vue 3 + TypeScript 作为前端，Rust 作为后端。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Rust + Tauri v2
- **Python**: 爬虫脚本执行

## 项目结构

```
tauri-lesson-1/
├── src/                    # 前端代码
│   ├── App.vue           # 主应用组件
│   ├── main.ts           # 入口文件
│   └── assets/           # 静态资源
├── src-tauri/            # Rust 后端代码
│   ├── src/
│   │   ├── main.rs       # 应用入口
│   │   └── lib.rs        # 核心逻辑和命令
│   ├── Cargo.toml        # Rust 依赖配置
│   └── tauri.conf.json   # Tauri 配置
└── 中国石油招标投标网/    # Python 爬虫脚本
    └── spiders.py        # 爬虫主脚本
```

## 核心功能

### 1. 爬虫任务执行

- **立即执行**: 点击"立即执行"按钮，立即运行爬虫脚本
- **定时执行**: 配置日期时间，在指定时间自动执行爬虫任务

### 2. 配置管理

- **保存配置**: 将当前配置保存到应用数据目录
- **加载配置**: 应用启动时自动加载保存的配置

### 3. 事件通信

- **定时任务结果**: 通过 Tauri 事件系统实时更新前端响应框
- **错误处理**: 捕获并显示执行错误信息

## Rust 后端命令

### `save_note`
保存配置到应用数据目录的 `spider_config.json` 文件。

**参数**:
- `content: String` - 配置 JSON 字符串

**返回**: `Result<String, String>`

### `load_note`
从应用数据目录加载配置。

**返回**: `Result<String, String>` - 配置 JSON 字符串

### `run_spider`
执行 Python 爬虫脚本。

**参数**:
- `params: SpiderParams` - 爬虫参数
  - `page: i32` - 页码
  - `title: String` - 搜索关键字
  - `project_type: String` - 项目类型

**返回**: `Result<String, String>` - 执行结果 JSON

### `start_scheduled_spider`
启动定时爬虫任务。

**参数**:
- `config: SpiderConfig` - 爬虫配置
  - `params: SpiderParams` - 爬虫参数
  - `email: String` - 接收邮箱
  - `year, month, day, hour, minute, second: u32` - 执行时间
  - `enabled: bool` - 是否启用

**返回**: `Result<String, String>`

### `send_email`
发送邮件（占位符实现，需要配置 SMTP）。

**参数**:
- `to: String` - 收件人
- `subject: String` - 主题
- `body: String` - 内容

**返回**: `Result<String, String>`

## 前端状态管理

### 爬虫参数
- `spiderPage`: 页码
- `spiderTitle`: 搜索关键字
- `spiderProjectType`: 项目类型（全部/物资/工程/服务）

### 定时任务配置
- `spiderEmail`: 接收邮箱
- `spiderPushContent`: 推送内容
- `spiderYear/Month/Day/Hour/Minute/Second`: 执行时间
- `spiderEnabled`: 是否启用定时任务
- `scheduledTaskStarted`: 定时任务是否已启动

### 执行状态
- `spiderLoading`: 是否正在执行
- `spiderResult`: 执行结果
- `spiderError`: 错误信息
- `spiderLog`: 日志信息

## 事件监听

### `scheduled-task-result`
定时任务执行成功时触发，更新响应框内容。

### `scheduled-task-error`
定时任务执行失败时触发，显示错误信息。

## 开发环境设置

### 前置要求
- Node.js 18+
- Rust 1.70+
- Python 3.x
- Tauri CLI

### 安装依赖

```bash
# 前端依赖
npm install

# Rust 依赖（自动安装）
cd src-tauri
cargo build
```

### 运行开发环境

```bash
npm run tauri dev
```

### 构建生产版本

```bash
npm run tauri build
```

## 配置说明

### Python 脚本路径

应用会自动查找 `中国石油招标投标网/spiders.py` 文件，查找顺序：
1. 从当前工作目录向上查找
2. 从可执行文件目录向上查找
3. 从项目根目录向上查找（最多10层）

### 配置文件位置

- **macOS**: `~/Library/Application Support/com.tauri.tauri-lesson-1/spider_config.json`
- **Windows**: `%APPDATA%\com.tauri.tauri-lesson-1\spider_config.json`
- **Linux**: `~/.config/com.tauri.tauri-lesson-1/spider_config.json`

## 注意事项

1. **Python 脚本**: 确保 `spiders.py` 文件存在于 `中国石油招标投标网` 目录中
2. **邮件功能**: `send_email` 函数目前是占位符实现，需要配置 SMTP 服务器
3. **定时任务**: 定时任务在应用关闭后不会继续运行，需要应用保持运行状态
4. **配置保存**: 配置保存在应用数据目录，不会因应用更新而丢失

## 常见问题

### Q: 找不到 Python 脚本？
A: 确保 `spiders.py` 文件在 `中国石油招标投标网` 目录中，且应用有读取权限。

### Q: 定时任务没有执行？
A: 检查应用是否在运行，定时任务需要应用保持运行状态。

### Q: 配置保存失败？
A: 检查应用数据目录的写入权限。

## 代码优化说明

- 已删除所有冗余注释
- 已删除未使用的函数（`greet`, `simple_add`）
- 已删除编译缓存（`target/` 目录）
- 已删除临时文件（`notebook.txt`）
- 代码结构已优化，去除冗余代码

