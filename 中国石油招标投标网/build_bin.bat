@echo off
REM 打包 Python 脚本为二进制文件 (Windows)
REM 使用方法: build_bin.bat

echo 🚀 开始打包 Python 脚本为二进制文件...

REM 检查 PyInstaller 是否安装
where pyinstaller >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ PyInstaller 未安装，正在安装...
    pip install pyinstaller
)

REM 检查 spec 文件是否存在
if not exist "spider_bin.spec" (
    echo ❌ spider_bin.spec 文件不存在
    exit /b 1
)

REM 清理旧的构建文件
echo 🧹 清理旧的构建文件...
if exist build rmdir /s /q build
if exist dist rmdir /s /q dist

REM 执行打包
echo 📦 开始打包...
pyinstaller spider_bin.spec

REM 检查打包结果
if exist "dist\spider_bin" (
    echo ✅ 打包成功！
    echo 📁 二进制文件位置: dist\spider_bin\
    
    REM 检查 onedir 模式
    if exist "dist\spider_bin\spider_bin\spider_bin.exe" (
        echo ✅ 找到 onedir 模式的可执行文件: dist\spider_bin\spider_bin\spider_bin.exe
    ) else if exist "dist\spider_bin\spider_bin.exe" (
        echo ✅ 找到可执行文件: dist\spider_bin\spider_bin.exe
    ) else (
        echo ⚠️  警告: 未找到可执行文件
    )
) else (
    echo ❌ 打包失败
    exit /b 1
)

echo ✨ 完成！

