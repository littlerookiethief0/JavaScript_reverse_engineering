# 从 0 到 1 开发指南

## 📋 目录

- [项目概述](#项目概述)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [环境搭建](#环境搭建)
- [从 0 到 1 开发流程](#从-0-到-1-开发流程)
- [核心功能实现](#核心功能实现)
- [打包部署](#打包部署)
- [性能优化](#性能优化)
- [常见问题](#常见问题)

---

## 项目概述

这是一个基于 **Tauri v2** 的跨平台桌面应用程序，用于自动化执行中国石油招标投标网的爬虫任务。应用采用前后端分离架构，前端使用 Vue 3 + TypeScript，后端使用 Rust，爬虫逻辑使用 Python 实现。

### 主要功能

- ✅ **爬虫任务执行**：支持立即执行和定时执行
- ✅ **配置管理**：保存和加载爬虫配置
- ✅ **邮件通知**：任务完成后自动发送邮件
- ✅ **SMTP 配置**：支持自定义 SMTP 服务器
- ✅ **系统通知**：任务执行状态实时通知

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Vue 3** | 3.5.13 | 前端框架 |
| **TypeScript** | 5.6.2 | 类型安全 |
| **Vite** | 6.0.3 | 构建工具 |
| **Tauri API** | ^2 | 与 Rust 后端通信 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Rust** | 1.70+ | 后端核心语言 |
| **Tauri v2** | 2.x | 桌面应用框架 |
| **Tokio** | 1.x | 异步运行时 |
| **Serde** | 1.x | 序列化/反序列化 |
| **Chrono** | 0.4 | 时间处理 |
| **Lettre** | 0.11 | SMTP 邮件发送 |

### Python 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | 3.9+ | 爬虫脚本语言 |
| **requests** | 2.32.5 | HTTP 请求 |
| **ddddocr** | latest | OCR 验证码识别 |
| **fake-useragent** | 2.2.0 | 随机 User-Agent |
| **execjs** | - | JavaScript 执行（已替换为 Node.js） |
| **PyInstaller** | 6.17.0 | Python 打包工具 |

### 工具链

- **Node.js** 18+：前端开发和构建
- **npm**：包管理
- **Cargo**：Rust 包管理
- **PyInstaller**：Python 脚本打包

---

## 项目结构

```
JavaScript_reverse_engineering/
├── rpa_app/                          # Tauri 应用主目录
│   ├── src/                          # 前端源代码
│   │   ├── App.vue                   # 主应用组件
│   │   ├── main.ts                   # 入口文件
│   │   ├── components/               # Vue 组件
│   │   │   └── FeatureList.vue
│   │   ├── composables/              # 组合式函数
│   │   │   ├── useEventListeners.ts  # 事件监听
│   │   │   ├── useNotification.ts    # 通知管理
│   │   │   ├── useSmtp.ts            # SMTP 配置
│   │   │   └── useSpider.ts          # 爬虫逻辑
│   │   ├── types/                    # TypeScript 类型定义
│   │   │   └── index.ts
│   │   └── utils/                    # 工具函数
│   │       ├── constants.ts
│   │       └── helpers.ts
│   ├── src-tauri/                    # Rust 后端
│   │   ├── src/
│   │   │   ├── main.rs               # 应用入口
│   │   │   └── lib.rs                # 核心逻辑和命令
│   │   ├── Cargo.toml                # Rust 依赖配置
│   │   ├── tauri.conf.json           # Tauri 配置文件
│   │   └── icons/                    # 应用图标
│   ├── package.json                  # Node.js 依赖
│   ├── vite.config.ts                # Vite 配置
│   └── tsconfig.json                 # TypeScript 配置
├── 中国石油招标投标网/                # Python 爬虫脚本
│   ├── spiders.py                    # 爬虫主脚本
│   ├── decryption.js                 # 加密解密 JS 代码
│   ├── jsencrypt.js                  # JSEncrypt 库
│   ├── js_executor.js                # Node.js 执行器
│   └── spider_bin.spec               # PyInstaller 配置
├── requirements.txt                   # Python 依赖
└── DEVELOPMENT_GUIDE.md              # 本文档
```

---

## 环境搭建

### 1. 安装 Node.js

```bash
# 使用 nvm 安装（推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18

# 或直接下载安装
# https://nodejs.org/
```

### 2. 安装 Rust

```bash
# 安装 Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# 配置环境变量
source $HOME/.cargo/env

# 验证安装
rustc --version
cargo --version
```

### 3. 安装 Python

```bash
# macOS
brew install python@3.9

# 或使用 pyenv
pyenv install 3.9.6
pyenv global 3.9.6

# 验证安装
python3 --version
```

### 4. 安装 Python 依赖

```bash
cd /path/to/JavaScript_reverse_engineering
pip3 install -r requirements.txt

# 额外安装打包工具
pip3 install pyinstaller
```

### 5. 安装 Tauri CLI

```bash
npm install -g @tauri-apps/cli@latest
```

---

## 从 0 到 1 开发流程

### 阶段 1：项目初始化

#### 1.1 创建 Tauri 项目

```bash
# 使用 Tauri CLI 创建项目
npm create tauri-app@latest rpa_app

# 选择配置：
# - Project name: rpa_app
# - Template: vue-ts
# - Package manager: npm
```

#### 1.2 安装前端依赖

```bash
cd rpa_app
npm install
```

#### 1.3 配置 Tauri

编辑 `src-tauri/tauri.conf.json`：

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "tauri-lesson-1",
  "version": "0.1.0",
  "identifier": "com.lizhuang.tauri-lesson-1",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  }
}
```

### 阶段 2：前端开发

#### 2.1 创建 Vue 组件

创建 `src/App.vue`：

```vue
<template>
  <div class="container">
    <h1>RPA 爬虫应用</h1>
    <!-- 爬虫配置表单 -->
    <!-- 执行按钮 -->
    <!-- 结果显示 -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
// 导入 composables
</script>
```

#### 2.2 创建 Composables

**useSpider.ts** - 爬虫逻辑：

```typescript
import { ref } from 'vue'
import { invoke } from '@tauri-apps/api/core'

export function useSpider() {
  const spiderLoading = ref(false)
  const spiderResult = ref('')
  
  async function runSpider(params: SpiderParams) {
    spiderLoading.value = true
    try {
      const result = await invoke<string>('run_spider', { params })
      spiderResult.value = result
    } catch (error) {
      console.error(error)
    } finally {
      spiderLoading.value = false
    }
  }
  
  return { spiderLoading, spiderResult, runSpider }
}
```

#### 2.3 类型定义

**types/index.ts**：

```typescript
export interface SpiderParams {
  page: number
  title: string
  project_type: string
}

export interface SpiderConfig {
  params: SpiderParams
  email: string
  // ...
}
```

### 阶段 3：后端开发

#### 3.1 定义 Rust 命令

**src-tauri/src/lib.rs**：

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
pub struct SpiderParams {
    pub page: i32,
    pub title: String,
    pub project_type: String,
}

#[tauri::command]
fn run_spider(app_handle: tauri::AppHandle, params: SpiderParams) -> Result<String, String> {
    // 执行 Python 脚本
    // ...
}
```

#### 3.2 注册命令

**src-tauri/src/lib.rs**：

```rust
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            run_spider,
            save_note,
            load_note,
            // ...
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 阶段 4：Python 爬虫开发

#### 4.1 创建爬虫脚本

**中国石油招标投标网/spiders.py**：

```python
import requests
import execjs
from ddddocr import DdddOcr

class Spider:
    def __init__(self):
        self.ocr = DdddOcr(show_ad=False)
        # ...
    
    def run(self, request_params):
        # 爬虫逻辑
        # ...
        return result
```

#### 4.2 处理 JavaScript 加密

由于目标网站使用 JavaScript 加密，需要：

1. **提取 JS 代码**：`decryption.js`、`jsencrypt.js`
2. **使用 Node.js 执行**：创建 `js_executor.js`
3. **Python 调用**：通过 subprocess 调用 Node.js

### 阶段 5：集成测试

#### 5.1 开发模式运行

```bash
cd rpa_app
npm run tauri dev
```

#### 5.2 测试功能

- ✅ 爬虫参数配置
- ✅ 立即执行功能
- ✅ 定时任务功能
- ✅ 配置保存/加载
- ✅ 邮件发送

---

## 核心功能实现

### 1. 爬虫执行流程

```
前端 (Vue) 
  ↓ invoke('run_spider')
后端 (Rust) 
  ↓ find_python() / find_spider_bin()
Python 脚本 / 打包二进制
  ↓ subprocess.run()
Node.js (js_executor.js)
  ↓ 执行 JavaScript 加密
HTTP 请求
  ↓ 获取数据
OCR 识别验证码（如需要）
  ↓ 返回结果
前端显示
```

### 2. 性能优化策略

#### 2.1 优先使用系统 Python

```rust
// 优先使用系统 Python（速度快，1-3秒）
if let Some(python) = find_python() {
    // 直接运行 Python 脚本
} else {
    // 回退到打包的二进制文件
}
```

#### 2.2 路径缓存

```rust
static mut CACHED_PYTHON: Option<String> = None;
static mut CACHED_SCRIPT: Option<PathBuf> = None;
```

#### 2.3 异步执行

```rust
#[tauri::command]
async fn run_spider(...) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        // 在后台线程执行
    }).await
}
```

### 3. 打包优化

#### 3.1 Python 脚本打包

```bash
# 使用 PyInstaller 打包
python3 -m PyInstaller \
  --onedir \
  --name spider_bin \
  --add-data "decryption.js:." \
  --add-data "jsencrypt.js:." \
  --add-data "js_executor.js:." \
  --collect-data ddddocr \
  --collect-data onnxruntime \
  --collect-data fake_useragent \
  spiders.py
```

#### 3.2 Tauri 资源打包

```json
{
  "resources": {
    "../../中国石油招标投标网/spiders.py": "spiders.py",
    "../../中国石油招标投标网/decryption.js": "decryption.js",
    "../../中国石油招标投标网/jsencrypt.js": "jsencrypt.js",
    "../../中国石油招标投标网/js_executor.js": "js_executor.js"
  }
}
```

---

## 打包部署

### 1. 开发环境测试

```bash
cd rpa_app
npm run tauri dev
```

### 2. 构建生产版本

```bash
# 构建前端
npm run build

# 打包 Tauri 应用
npm run tauri build
```

### 3. 输出文件

打包完成后，应用位于：

```
src-tauri/target/release/bundle/
├── macos/
│   └── tauri-lesson-1.app      # macOS 应用
└── dmg/
    └── tauri-lesson-1_0.1.0_aarch64.dmg  # DMG 安装包
```

### 4. 分发

- **macOS**: 提供 `.dmg` 文件
- **Windows**: 提供 `.msi` 或 `.exe` 文件
- **Linux**: 提供 `.AppImage` 或 `.deb` 文件

---

## 性能优化

### 优化前 vs 优化后

| 指标 | 优化前 | 优化后 |
|------|--------|--------|
| **执行速度** | 28-46 秒 | 1-3 秒 |
| **启动方式** | 打包二进制（需解压） | 系统 Python（直接运行） |
| **文件大小** | 136MB | 脚本文件（几 KB） |
| **依赖管理** | 全部打包 | 使用系统环境 |

### 优化措施

1. ✅ **优先使用系统 Python**：避免打包二进制文件的启动开销
2. ✅ **路径缓存**：避免重复查找文件路径
3. ✅ **异步执行**：不阻塞 UI 线程
4. ✅ **智能回退**：无 Python 时自动使用打包版本

---

## 常见问题

### Q1: 找不到 Python 脚本？

**A**: 确保脚本文件已正确打包到应用资源目录：

```bash
# 检查资源文件
ls -la src-tauri/target/release/bundle/macos/tauri-lesson-1.app/Contents/Resources/
```

### Q2: 执行速度慢？

**A**: 
1. 确保系统已安装 Python 3.9+
2. 检查 Python 是否在 PATH 中：`which python3`
3. 如果系统没有 Python，会自动使用打包版本（较慢）

### Q3: Node.js 找不到？

**A**: 
1. 安装 Node.js：`brew install node` 或访问 https://nodejs.org/
2. 验证安装：`node --version`
3. 确保 Node.js 在 PATH 中

### Q4: 打包失败？

**A**: 
1. 检查 Rust 工具链：`rustc --version`
2. 检查 Tauri CLI：`tauri --version`
3. 清理缓存：`cargo clean` 然后重新打包

### Q5: 邮件发送失败？

**A**: 
1. 检查 SMTP 配置是否正确
2. QQ 邮箱需要使用授权码（不是登录密码）
3. 确保网络连接正常

### Q6: OCR 识别失败？

**A**: 
1. 确保 `ddddocr` 的模型文件已正确打包
2. 检查网络连接（首次使用需要下载模型）
3. 查看错误日志定位问题

---

## 开发技巧

### 1. 调试技巧

#### 前端调试

```typescript
// 使用 console.log
console.log('Debug info:', data)

// 使用 Tauri 日志
import { log } from '@tauri-apps/plugin-log'
log.info('Debug message')
```

#### 后端调试

```rust
// 使用 println!
println!("[Debug] Value: {:?}", value);

// 使用 eprintln! 输出到 stderr
eprintln!("[Error] {}", error);
```

### 2. 热重载

开发模式下，前端支持热重载：

```bash
npm run tauri dev
```

修改前端代码会自动刷新，修改 Rust 代码需要重启应用。

### 3. 类型安全

充分利用 TypeScript 和 Rust 的类型系统：

```typescript
// TypeScript
interface SpiderParams {
  page: number
  title: string
}
```

```rust
// Rust
#[derive(Serialize, Deserialize)]
pub struct SpiderParams {
    pub page: i32,
    pub title: String,
}
```

---

## 项目里程碑

### v0.1.0 - 初始版本

- ✅ 基础爬虫功能
- ✅ 定时任务
- ✅ 配置管理
- ✅ 邮件通知

### v0.2.0 - 性能优化

- ✅ 优先使用系统 Python
- ✅ 路径缓存机制
- ✅ 异步执行优化
- ✅ 打包优化

---

## 参考资料

- [Tauri 官方文档](https://tauri.app/)
- [Vue 3 文档](https://vuejs.org/)
- [Rust 官方文档](https://www.rust-lang.org/)
- [PyInstaller 文档](https://pyinstaller.org/)

---

## 贡献指南

1. Fork 项目
2. 创建功能分支：`git checkout -b feature/AmazingFeature`
3. 提交更改：`git commit -m 'Add some AmazingFeature'`
4. 推送到分支：`git push origin feature/AmazingFeature`
5. 提交 Pull Request

---

## 许可证

本项目采用 MIT 许可证。

---

**最后更新**: 2025-12-03  
**维护者**: lizhuang

