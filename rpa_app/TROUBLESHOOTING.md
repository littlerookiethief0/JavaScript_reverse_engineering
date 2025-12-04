# 故障排除指南

## 问题：爬虫执行失败 - 爬虫可执行文件不存在

### 错误信息
```
❌ 爬虫执行失败
错误: 爬虫可执行文件不存在。
已搜索路径:
- 资源目录: "/Applications/tauri-lesson-1.app/Contents/Resources/bin/spider_bin/spider_bin"
- 当前工作目录: "/"
```

### 原因分析

应用执行爬虫任务时有两种方式：
1. **优先方式**：使用系统 Python 运行脚本（`spiders.py`）- 已打包到应用中
2. **备用方式**：使用打包的二进制文件（`spider_bin`）- 如果未打包则不可用

如果出现此错误，通常是因为：
- 系统未安装 Python 3
- Python 3 未添加到系统 PATH 环境变量
- Python 脚本执行失败，且找不到备用二进制文件

### 解决方案

#### 方案 1：安装 Python 3（推荐）

**macOS:**
```bash
# 使用 Homebrew 安装
brew install python3

# 或从官网下载安装
# https://www.python.org/downloads/
```

**Windows:**
1. 从 [Python 官网](https://www.python.org/downloads/) 下载安装程序
2. 安装时**务必勾选** "Add Python to PATH"
3. 重启应用

**Linux:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install python3

# CentOS/RHEL
sudo yum install python3
```

#### 方案 2：验证 Python 安装

打开终端，运行：
```bash
python3 --version
# 或
python --version
```

如果显示版本号（如 `Python 3.11.0`），说明已安装。

#### 方案 3：检查 PATH 环境变量

**macOS/Linux:**
```bash
echo $PATH
# 应该包含 Python 的路径，如 /usr/local/bin 或 /usr/bin
```

**Windows:**
1. 打开"系统属性" → "高级" → "环境变量"
2. 检查"系统变量"中的 `Path` 是否包含 Python 路径
3. 通常路径类似：`C:\Python311` 或 `C:\Users\用户名\AppData\Local\Programs\Python\Python311`

#### 方案 4：手动指定 Python 路径（高级）

如果 Python 安装在非标准位置，可以：
1. 创建符号链接到标准路径
2. 或修改系统 PATH 环境变量

### 验证修复

修复后，重新启动应用，执行爬虫任务应该可以正常工作。

如果问题仍然存在，请检查：
1. Python 版本是否为 3.x（不是 2.x）
2. 应用是否有权限执行 Python
3. 系统防火墙或安全软件是否阻止了应用

### 其他常见问题

#### Q: 为什么应用需要 Python？

A: 应用使用 Python 脚本执行爬虫任务，这样可以：
- 灵活修改爬虫逻辑
- 利用 Python 丰富的库生态
- 避免每次修改都需要重新编译应用

#### Q: 能否不使用 Python？

A: 可以，但需要：
1. 将 Python 脚本打包成独立的可执行文件（使用 PyInstaller 等工具）
2. 将可执行文件添加到应用的资源目录
3. 修改应用配置以包含该文件

#### Q: 应用在开发环境正常，打包后出错？

A: 这是因为：
- 开发环境：应用从项目目录查找脚本
- 打包后：应用从资源目录查找脚本
- 确保 `tauri.conf.json` 中正确配置了资源路径

### 获取帮助

如果以上方案都无法解决问题，请提供以下信息：
1. 操作系统版本
2. Python 版本（`python3 --version`）
3. 完整的错误信息
4. 应用日志（如果有）

