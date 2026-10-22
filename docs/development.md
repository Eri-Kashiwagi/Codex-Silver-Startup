# 开发说明

## 结构

```text
animation.js / style.css / index.html  开屏时间线和设置界面
image-settings.js                     本机图片、视频导入与持久化
assets/                               默认图片、线稿、视频和图标
extension/                            临时页面接入、视频层与 CDP 客户端
windows/                              官方 MSIX 激活、签名验证与启动入口
tools/                                自动化检查、构建和发行包核对
release/                              本地生成的便携包和源码 ZIP（不提交）
```

## 构建

Windows x64 上使用 .NET Framework 编译器，不要求 npm install。开发测试使用 Node 22+：

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

构建工具只从 project.json 的 runtimeFiles/sourceFiles 明确清单复制文件。它不会压缩现有 app 目录，也不会递归复制整个工作目录。重复构建时用新的输出目录，例如 `-OutputDirectory release-local-check`。

Git 同样采用文件允许名单，其他文件默认忽略。新增需要公开的源文件时，同时更新 project.json 和 .gitignore，再核对 Git 状态。不要通过批量强制添加把本机证据或新生成的日志纳入仓库。

图片与视频设置使用本项目独立的 IndexedDB 命名空间，不读取本次制作所用个人版本的设置。运行状态在便携目录内新建 state，发行包中不预置此目录。

## 检查实际运行环境

下面的检查只发现官方包和受信任 Node，不启动或注入 Codex：

```powershell
powershell -NoProfile -File windows/launch.ps1 -CheckOnly -NoDialog
```

输出可能包含执行者自己的路径，不作为公开截图或发行文件提交。

## 真实窗口核对

自动化代码检查、离屏浏览器检查、实际 Codex 检查分开记录。程序构建成功不等于目标机器已完成端到端验证。实际窗口核对应确认开屏、设置、视频选择、播放结束、白色/原有主题恢复，以及不同窗口尺寸的输入框遮挡。

不要为了测试重启、结束或注入正在使用的主聊天窗口。诊断目录可能仍关联账户状态，不能因名称带 diagnostic 就视为可公开。
