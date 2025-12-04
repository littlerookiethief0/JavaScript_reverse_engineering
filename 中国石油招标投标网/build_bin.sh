#!/bin/bash

# 打包 Python 脚本为二进制文件
# 使用方法: ./build_bin.sh

set -e

echo "🚀 开始打包 Python 脚本为二进制文件..."

# 检查 PyInstaller 是否安装
if ! command -v pyinstaller &> /dev/null; then
    echo "❌ PyInstaller 未安装，正在安装..."
    pip install pyinstaller
fi

# 检查 spec 文件是否存在
if [ ! -f "spider_bin.spec" ]; then
    echo "❌ spider_bin.spec 文件不存在"
    exit 1
fi

# 清理旧的构建文件
echo "🧹 清理旧的构建文件..."
rm -rf build dist

# 执行打包
echo "📦 开始打包..."
pyinstaller spider_bin.spec

# 检查打包结果
if [ -d "dist/spider_bin" ]; then
    echo "✅ 打包成功！"
    echo "📁 二进制文件位置: dist/spider_bin/"
    
    # 检查 onedir 模式
    if [ -f "dist/spider_bin/spider_bin/spider_bin" ]; then
        echo "✅ 找到 onedir 模式的可执行文件: dist/spider_bin/spider_bin/spider_bin"
    elif [ -f "dist/spider_bin/spider_bin" ]; then
        echo "✅ 找到可执行文件: dist/spider_bin/spider_bin"
    else
        echo "⚠️  警告: 未找到可执行文件"
    fi
else
    echo "❌ 打包失败"
    exit 1
fi

echo "✨ 完成！"

