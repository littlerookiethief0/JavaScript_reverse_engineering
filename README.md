# JavaScript 逆向工程项目

这是一个用于爬取中国石油招标投标网数据的 Python 爬虫项目，通过逆向分析网站的 JavaScript 加密逻辑来实现数据获取。

## 项目结构

```
JavaScript_reverse_engineering/
├── 中国石油招标投标网/
│   ├── spiders.py          # 主爬虫脚本
│   ├── decryption.js       # JavaScript 解密函数
│   └── jsencrypt.js        # JSEncrypt 加密库
├── .vscode/                # VS Code 配置文件
│   ├── launch.json         # 调试配置
│   └── settings.json       # 工作区设置
├── requirements.txt        # Python 依赖
└── README.md              # 项目说明文档
```

## 功能特性

- 🔐 **JavaScript 逆向**：通过 `execjs` 执行 JavaScript 加密/解密逻辑
- 🕷️ **数据爬取**：自动爬取招标投标信息
- 🔄 **验证码处理**：自动识别和处理验证码
- 🎭 **请求头伪装**：使用随机 User-Agent 避免被检测

## 环境要求

- Python 3.7+
- Node.js (用于 execjs 执行 JavaScript)

## 安装依赖

使用 `uv` 安装依赖：

```bash
uv pip install -r requirements.txt
```

或使用传统的 pip：

```bash
pip install -r requirements.txt
```

## 依赖说明

- `execjs` - 执行 JavaScript 代码
- `requests` - HTTP 请求库
- `fake-useragent` - 生成随机 User-Agent

## 使用方法

### 命令行运行

在项目根目录运行：

```bash
python 中国石油招标投标网/spiders.py
```

或在脚本所在目录运行：

```bash
cd 中国石油招标投标网
python spiders.py
```

### VS Code 调试

项目已配置 VS Code 调试环境：

1. 打开 `spiders.py` 文件
2. 按 `F5` 或点击"运行和调试"
3. 选择"Python: 调试当前文件"

**配置说明：**
- `launch.json` 已配置工作目录为脚本所在目录
- `settings.json` 已设置 Python 在文件目录执行

## 工作原理

1. **获取加密密钥**：从网站 CSS 文件中提取 base64 编码的公钥和私钥
2. **参数加密**：使用 JSEncrypt 对请求参数进行 RSA 加密
3. **发送请求**：发送加密后的请求到目标 API
4. **响应解密**：对返回的加密数据进行解密
5. **验证码处理**：遇到验证码时自动识别并处理

## 注意事项

- ⚠️ 请遵守网站的 robots.txt 和使用条款
- ⚠️ 建议添加适当的请求间隔，避免对服务器造成压力
- ⚠️ 验证码识别服务需要有效的 token

## 配置说明

### VS Code 配置

`.vscode/launch.json` 和 `.vscode/settings.json` 已配置为：
- 调试时工作目录自动设置为脚本所在目录
- 运行 Python 文件时在文件目录执行

这样可以确保相对路径（如 `decryption.js`）能够正确找到。

## 许可证

本项目仅供学习研究使用。

