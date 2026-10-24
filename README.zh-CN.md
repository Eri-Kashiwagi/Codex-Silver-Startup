# Codex Silver Startup · ChatGPT 娘化开屏动画
[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

以 **ChatGPT 娘化形象** 为主题，为 Windows Codex 加入开屏动画和进入后的角色动画。完整解压便携包，双击 **Start Codex.exe** 即可使用随附图片和视频，也可以换成自己的素材。

[下载 Windows 便携包](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases/latest) · [源码仓库](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup)

## 普通用户怎么用

1. 安装 Microsoft Store / MSIX 版官方 Codex，并至少打开一次完成初始化。
2. 下载名称以 `windows-x64.zip` 结尾的文件。在 ZIP 的“属性”中选择“解除锁定”（若有此选项），再完整解压到固定文件夹。
3. 保存工作，在菜单或托盘中彻底退出 Codex。
4. 双击 **Start Codex.exe**。
5. 双击 **Animation Settings.exe**，或在 Codex 窗口内按 **Ctrl+Alt+B**，调整语言、图片、文字和视频。

请保留整个文件夹。`source.zip` 是开发用源码包，普通用户下载 Windows 便携包即可。

## 语言与动画设置

**默认语言为英语。** 设置界面支持英语、简体中文、繁体中文、日语和俄语。在 **Language** 中选择语言，再点击“保存并预览”即可记住选择。关闭设置会放弃尚未保存的修改；切换语言不会翻译或覆盖你自己填写的欢迎语。

开屏约 12 秒，可按 Esc 跳过。进入聊天界面后，角色视频播放一次，结束时淡出并恢复原有外观。开屏和角色视频在后台或隐藏窗口时仍继续推进，返回时对齐实际经过的时间。手动暂停和打开设置仍会暂停播放。

图片上限 30 MiB，MP4 / WebM 视频上限 64 MiB，推荐 H.264 MP4。开屏图片和进入后的视频分别设置，个人素材保存在本机。随附视频为静音视频。

在设置中点击“关闭美化，恢复 Codex 外观”可恢复界面。彻底退出后从官方图标重开，可恢复普通会话。程序不修改官方安装目录或快捷方式。

## 环境

Windows 10/11 x64、.NET Framework 4.x，以及 Microsoft Store / MSIX 版官方 Codex。运行复用经过签名检查的官方 Node 环境，无需另外安装 Node、Python 或 FFmpeg。

启动入口为未签名的本地构建 EXE。项目使用随机回环调试端口接入官方窗口；端口随本次 Codex 进程保留，同机进程可访问。启动器诊断信息使用英语，动画与设置界面使用所选语言。

## 开发与构建

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

测试需要 Node 22+；构建使用 Windows .NET Framework 编译器，产物位于 `release/`。重复构建请指定新的 `-OutputDirectory`。各语言文案独立放在 `locales/`，缺失翻译回退到英语，无需联网翻译。

见[开发说明](docs/development.md)和[测试说明](docs/testing.md)。

## 来源与致谢

感谢以下项目提供的代码基础与实现参考：

| 项目 | 在本项目中的作用 |
| --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | 直接代码基础：Windows 启动、开屏动画、图片设置与窗口接入 |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | 上游代码来源：启动时间线、图片导入、轮廓提取与临时页面接入 |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | 上述 fork 链的更早上游 |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | 启动与窗口交接的实现参考 |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | 外观面板、透明背景与运行环境处理参考 |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | 启动动画与视频播放思路参考 |

本项目加入 ChatGPT 娘化素材、单次角色视频、结束后的外观恢复、多语言设置和便携发布包。参考版本与修改范围见[来源说明](THIRD_PARTY_NOTICES.md)。

## 许可与素材

原创代码、修改与文档采用 [MIT License](LICENSE)。第三方代码见[来源说明](THIRD_PARTY_NOTICES.md)，默认图片与视频见[素材说明](media/MEDIA_NOTICE.md)。

本项目是非官方社区工具，与 OpenAI 无官方关联。
