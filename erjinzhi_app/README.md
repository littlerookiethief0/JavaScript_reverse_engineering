# 二进制应用 (erjinzhi-app)

基于 Tauri + Rust + Vue + TypeScript 的桌面应用，支持执行 Python+JS 自动化脚本的打包二进制文件。

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite
- **后端**: Rust + Tauri 2
- **自动化脚本**: Python + JavaScript
- **打包工具**: PyInstaller

## 项目结构

```
erjinzhi_app/
├── src/                    # Vue 前端代码
│   ├── components/         # Vue 组件
│   ├── composables/        # Vue Composables
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   └── App.vue             # 主应用组件
├── src-tauri/              # Rust 后端代码
│   ├── src/
│   │   ├── lib.rs          # 主要业务逻辑
│   │   └── main.rs         # 入口文件
│   ├── Cargo.toml          # Rust 依赖配置
│   └── tauri.conf.json     # Tauri 配置
└── package.json            # Node.js 依赖配置
```

## 功能特性

1. **爬虫任务执行**: 支持执行中国石油招标投标网爬虫任务
2. **定时任务**: 支持设置定时执行任务
3. **邮件通知**: 支持 SMTP 邮件发送
4. **二进制执行**: 优先使用 Python 脚本，回退到打包的二进制文件
5. **跨平台**: 支持 Windows、macOS、Linux

## 开发环境设置

### 前置要求

1. **Node.js** (v18+)
2. **Rust** (最新稳定版)
3. **Python 3** (可选，用于开发环境)
4. **PyInstaller** (用于打包 Python 脚本)

### 安装步骤

1. 安装依赖：

```bash
npm install
```

2. 安装 Rust 依赖（首次运行会自动安装）：

```bash
cd src-tauri
cargo build
cd ..
```

3. 开发模式运行：

```bash
npm run tauri dev
```

## 打包 Python 脚本为二进制

### 1. 安装 PyInstaller

```bash
pip install pyinstaller
```

### 2. 打包脚本

在 `中国石油招标投标网` 目录下执行：

```bash
pyinstaller spider_bin.spec
```

打包完成后，二进制文件位于：
- **onedir 模式**: `dist/spider_bin/spider_bin/spider_bin`
- **旧版本**: `dist/spider_bin/spider_bin`

### 3. 将二进制文件复制到 Tauri 资源目录

打包 Tauri 应用时，二进制文件会自动从 `中国石油招标投标网/dist/spider_bin` 复制到应用资源目录。

## 构建应用

### 开发构建

```bash
npm run tauri dev
```

### 生产构建

```bash
npm run tauri build
```

构建产物位于 `src-tauri/target/release/` 目录。

## 执行逻辑

应用执行任务的优先级：

1. **优先使用系统 Python**: 如果检测到系统 Python 环境，直接执行 Python 脚本（速度快，1-3秒）
2. **回退到打包二进制**: 如果 Python 不可用或执行失败，使用打包的二进制文件

## 配置说明

### SMTP 配置

应用支持通过界面配置 SMTP 服务器，默认使用 QQ 邮箱：
- 服务器: `smtp.qq.com`
- 端口: `587`
- 需要 QQ 邮箱授权码（不是登录密码）

### 爬虫配置

配置保存在应用数据目录的 `spider_config.json` 文件中。

## 跨平台兼容性

- ✅ **macOS**: 完全支持
- ✅ **Windows**: 完全支持
- ✅ **Linux**: 完全支持

## 注意事项

1. **Python 环境**: 开发环境建议安装 Python 3，生产环境可以只使用打包的二进制文件
2. **Node.js**: 爬虫脚本需要 Node.js 执行 JavaScript 代码
3. **二进制文件**: 打包的二进制文件需要包含所有依赖（通过 PyInstaller 自动处理）

## 故障排查

### 找不到 Python 脚本或二进制文件

1. 检查资源目录是否正确配置在 `tauri.conf.json` 中
2. 确保 Python 脚本或二进制文件存在于指定路径
3. 查看应用日志获取详细错误信息

### 邮件发送失败

1. 检查 SMTP 配置是否正确
2. 确认 QQ 邮箱授权码是否正确（不是登录密码）
3. 检查网络连接是否正常

## 许可证

MIT License

