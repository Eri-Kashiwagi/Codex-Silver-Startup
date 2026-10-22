# 开发说明

## 结构

```text
animation.js / style.css / index.html  开屏时间线和设置界面
image-settings.js                     本机图片、视频导入与持久化
i18n.js / locales/                    五种语言的本地文案与英文回退
README*.md                            英文首页及四种翻译，通过顶部导航切换
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

## 多语言

默认语言固定为英语，不跟随操作系统。设置中的语言选择作为 `language` 字段和图片、文字一同保存到 IndexedDB。语言切换立即预览，点击“保存并预览”才持久化；取消时恢复之前的语言。重置图片与文字保留语言选择，自定义文字不会自动翻译。

`locales/en.js` 是消息键的基准，`zh-CN.js`、`zh-TW.js`、`ja.js`、`ru.js` 提供对应翻译。语言目录采用普通 JavaScript 数据文件，使直接打开 index.html 和注入页面都无需网络请求或额外打包依赖。HTML 使用 data-i18n 标记，动态消息通过 SilverI18n.t 读取，输出使用 textContent。英文装饰性 HUD 字样保留原设计；启动器技术诊断统一使用英语。

新增语言时同时更新目录、index.html 脚本列表、extension/payload.mjs 接入列表、i18n.js 支持列表、设置选项、发行清单和测试。修改消息时同步五种语言；缺失译文会使用英语。五种 README 保留相同的顶部语言导航与来源说明。

## 检查实际运行环境

下面的检查只发现官方包和受信任 Node，不启动或注入 Codex：

```powershell
powershell -NoProfile -File windows/launch.ps1 -CheckOnly -NoDialog
```

输出可能包含执行者自己的路径，不作为公开截图或发行文件提交。

## 真实窗口核对

自动化代码检查、离屏浏览器检查、实际 Codex 检查分开记录。程序构建成功不等于目标机器已完成端到端验证。实际窗口核对应确认开屏、设置、视频选择、播放结束、白色/原有主题恢复，以及不同窗口尺寸的输入框遮挡。

不要为了测试重启、结束或注入正在使用的主聊天窗口。诊断目录可能仍关联账户状态，不能因名称带 diagnostic 就视为可公开。
