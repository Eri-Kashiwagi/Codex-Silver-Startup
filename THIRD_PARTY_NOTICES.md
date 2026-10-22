# 来源与修改说明

感谢以下项目作者提供的代码基础与实现参考。表中记录本项目使用的来源关系和参考版本。

## 基础与参考项目

| 项目 | 参考版本 | 用途 |
| --- | --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | [10d986ca532564a7546c32838567eb01e94ef2dd](https://github.com/lilhuu/Codex-Startup-Windows/tree/10d986ca532564a7546c32838567eb01e94ef2dd) | 本项目的直接基础，包含前端动画、图片设置、CDP 接入与 Windows 启动代码 |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | [52bf7c7377663c42aad0730ab4868a48c1e1d2be](https://github.com/M1ddle0/codex-startup-animation/tree/52bf7c7377663c42aad0730ab4868a48c1e1d2be) | 上述基础的上游，包含启动时间线、图片导入、轮廓提取、临时 iframe 等代码来源 |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | 通过上述 fork 链追溯 | 更早的上游 |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | [c63a203e5857e85fb3c8a9891eddb570e7a27b54](https://github.com/yushua0808-cpu/dragon-codex-boot/tree/c63a203e5857e85fb3c8a9891eddb570e7a27b54) | 启动与窗口交接参考 |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | [6fc42df48a6a5365011f55cc349e20c038e56d1d](https://github.com/Fei-Away/Codex-Dream-Skin/tree/6fc42df48a6a5365011f55cc349e20c038e56d1d) | 外观、透明面板与运行环境处理参考 |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | [v1.0.0](https://github.com/mytjxs/codex-startup-animation/releases/tag/v1.0.0) | 启动动画与视频播放思路参考 |

本次修改包括：替换角色图片与线稿、独立工作区视频、默认 MP4 载入、开屏结束后单次播放、设置和隐藏时暂停、结束后恢复原有外观，以及独立的便携发行构建。

本项目为独立便携启动器，不依赖外部桌宠或既有本机状态。图片与视频设置使用独立的本机命名空间。

## 许可范围

直接基础项目的 [来源说明](https://github.com/lilhuu/Codex-Startup-Windows/blob/main/docs/references.md) 记载继承版本未附明确 LICENSE。本项目保留该事实，不对整个继承实现统一授予 MIT。具体范围见根目录 LICENSE。

上表中的 dragon-codex-boot 和 Codex-Dream-Skin 参考版本包含 MIT 许可。这里标明参考关系，不表示它们为其他上游代码或角色素材提供授权。

## 运行与制作工具

运行使用用户自己的 Windows、.NET Framework、官方 Codex 和经签名检查的官方 Node 环境，不分发官方客户端或 Node 二进制。Node 内置库及浏览器 API 供程序运行使用，没有附带 npm 库。

角色图片经 imagegen 按录屏外观参考制作；角色视频通过 Hailuo 生成，使用 FFmpeg 进行本地裁切与编码。媒体权利与代码许可分开处理，见 media/MEDIA_NOTICE.md。

OpenAI、Codex、ChatGPT 和 Windows 名称用于说明所支持的产品和平台。本项目与这些产品的官方团队没有隶属关系。
