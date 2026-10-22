# Codex Silver Startup · ChatGPT 娘化开屏动画

以 **ChatGPT 娘化形象** 为主题，为 Windows Codex 加入开屏动画和进入后的角色动画。下载便携包、完整解压，双击 **启动 Codex.exe** 即可使用随附图片和视频。也可以通过设置更换自己的图片、文字和视频。

[下载 Windows 便携包](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases/latest/download/Codex-Silver-Startup-0.1.1-windows-x64.zip) · [查看发布版本](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases) · [源码仓库](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup)

## 普通用户怎么用

1. 安装 Microsoft Store / MSIX 版官方 Codex，并至少打开一次完成初始化。
2. 下载名称以 `windows-x64.zip` 结尾的便携包，先在 ZIP 的“属性”中选择“解除锁定”（若有此选项），再完整解压到自己的固定文件夹。不要在 ZIP 内直接运行。
3. 保存工作，在菜单或托盘中彻底退出 Codex。
4. 双击 **启动 Codex.exe**。开屏之后会播放随附角色视频。
5. 双击 **图片与动画设置.exe** 或在窗口内按 `Ctrl+Alt+B`，更换图片、欢迎文字和 MP4 / WebM 视频。

源码包名称以 `source.zip` 结尾，供开发者修改和构建；普通用户使用便携包即可。本地已构建文件位于 `release/`。

## 动画与设置

开屏是约 12 秒的前端动画，可按 Esc 跳过。进入聊天界面后，角色视频从头播放一次；后台或最小化时暂停，返回后继续。视频结束触发约 1.8 秒的背景淡出，并恢复接入前的界面外观。

开屏图片与进入后的角色视频可以分别更换。图片上限 30 MiB，视频上限 64 MiB；优先使用 H.264 MP4。个人导入内容保存在本机，不上传。随附人物视频为静音视频。

通过原来的官方 Codex 图标启动仍是普通启动。需要退出美化时，在设置中点击“关闭美化，恢复 Codex 外观”；彻底退出后从官方图标重开，可结束本次调试连接。程序不修改官方安装目录或官方快捷方式。

## 环境

Windows 10/11 x64、.NET Framework 4.x，以及 Microsoft Store / MSIX 版官方 Codex。运行复用经过签名检查的官方 Node 环境，不要求普通用户另外安装 Node、Python 或 FFmpeg。官方运行环境缺失时，先从原图标打开 Codex 完成初始化。

启动入口为未签名的本地构建 EXE。项目使用随机回环调试端口接入官方窗口；端口随本次 Codex 进程保留，同机进程可访问该接口。完整退出后从官方图标重开即可恢复普通运行。

## 开发与构建

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

开发测试需要 Node 22+；构建使用 Windows 自带的 .NET Framework 编译器。构建产物包括普通用户便携包、源码 ZIP 和 SHA256 校验文件。重复构建请指定新的 `-OutputDirectory`，避免覆盖已有包。

项目结构与验证方法见 [开发说明](docs/development.md) 和 [测试说明](docs/testing.md)。

## 来源与致谢

感谢以下项目作者提供的代码基础与实现参考：

| 项目 | 在本项目中的作用 |
| --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | 直接代码基础：Windows 启动、开屏动画、图片设置与窗口接入 |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | 上游代码来源：启动时间线、图片导入、轮廓提取与临时页面接入 |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | 上述 fork 链的更早上游 |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | 启动与窗口交接的实现参考 |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | 外观面板、透明背景与运行环境处理参考 |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | 启动动画与视频播放思路参考 |

本项目在上述基础上加入 ChatGPT 娘化形象素材、进入后的单次角色视频、视频结束后的界面恢复，以及便携发布包。参考版本和修改范围见 [来源与修改说明](THIRD_PARTY_NOTICES.md)。

## 许可与素材

本项目的原创代码、修改与文档采用 [MIT License](LICENSE)。第三方代码的来源与许可见 [来源说明](THIRD_PARTY_NOTICES.md)，默认图片与视频见 [素材说明](media/MEDIA_NOTICE.md)。

本项目是非官方社区工具，与 OpenAI 无官方关联。
