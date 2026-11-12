# OJBetter Bridge

## 安装与使用

1. 更新整个 Bridge 文件夹。运行源码前执行
   `python -m pip install -r requirements.txt`。GUI 另外需要原有的
   PyQt5 和 PyQt-Fluent-Widgets；旧的 `server_gui.exe` 不包含源码修复，
   必须重新打包后才能使用。
2. 启动 `python server_cli.py` 或更新后的 GUI。Bridge 只允许监听本机回环地址。
3. 更新 Codeforces / AtCoder 用户脚本并刷新题目页面。启用 Bridge 补全时，脚本会识别
   Bridge 协议并自动读取实际 `workspaces` 路径，保存设置并备份原值，无需手动改路径。
   WebSocket 地址保持 `ws://127.0.0.1:2323/`；使用自定义端口时仍需填写对应地址。

如果检测到旧版 Bridge，脚本会提示升级并暂停 Bridge 补全，普通编辑器仍可使用。
连接失败、超时或响应未知时不会改写设置，也不会误判为旧版。更新 Bridge 后重启并刷新页面。

## Windows 构建

GitHub Actions 的 `Build Bridge for Windows` 会在 Windows 上运行测试、打包 GUI，
并启动生成的 exe 检查来源拦截、文件同步、clangd 和 GUI 启停按钮。
也可以在 Actions 页面选择此工作流，点击 `Run workflow` 手动构建。

成功后从该次运行的 Artifacts 下载 `OJBetter_Bridge-windows-x64`，
解压其中的 zip，保留整个 `OJBetter_Bridge` 文件夹并运行 `server_gui.exe`。
`_internal` 文件夹是运行依赖，必须和 exe 一起保留。语言服务器仍需单独安装。
构建包附带 SHA-256 校验文件；诊断产物包含 GUI 截图和检查结果。

本地 Windows 构建：

```powershell
python -m pip install -r OJBetter_Bridge/requirements-windows.txt
python OJBetter_Bridge/build_windows.py
python OJBetter_Bridge/tests/smoke_windows.py --package dist/OJBetter_Bridge --report dist/smoke
```

## 更新说明

本次修复 Bridge 安全问题，建议使用者在修复版发布后同步更新 Bridge 和用户脚本。
Bridge 是本机开发工具，请仅在可信的 Codeforces / AtCoder 页面使用。
