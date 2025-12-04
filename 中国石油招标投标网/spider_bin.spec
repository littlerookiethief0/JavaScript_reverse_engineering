# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_data_files

# 包含 JavaScript 文件
datas = [
    ('decryption.js', '.'),
    ('jsencrypt.js', '.'),
    ('js_executor.js', '.')
]

# 收集依赖库的数据文件
datas += collect_data_files('ddddocr')
datas += collect_data_files('onnxruntime')
datas += collect_data_files('fake_useragent')

a = Analysis(
    ['spiders.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'ddddocr',
        'ddddocr.ddddocr',
        'onnxruntime',
        'onnxruntime.capi',
        'fake_useragent',
        'fake_useragent.fake',
        'requests',
        'urllib3',
        'certifi',
        'charset_normalizer',
        'idna',
        'json',
        'subprocess',
        'tempfile',
        're',
        'time',
        'warnings',
        'os',
        'sys',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name='spider_bin',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    upx_exclude=[],
    name='spider_bin',
)
