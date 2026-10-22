# Codex Silver Startup · ChatGPT Anime Girl
[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

A startup animation and a character video for **Windows Codex**, featuring an anime girl personification of ChatGPT. Extract the portable package and run **Start Codex.exe**. Default images and video are included; you can also use your own.

[Download the Windows package](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases/latest) · [Source code](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup)

## Getting started

1. Install the official Microsoft Store / MSIX version of Codex and open it once to finish setup.
2. Download the release file ending in `windows-x64.zip`. In the ZIP file’s Properties, select **Unblock** if available, then extract the entire folder.
3. Save your work and fully quit Codex from its menu or tray.
4. Double-click **Start Codex.exe**.
5. Open **Animation Settings.exe**, or press **Ctrl+Alt+B** in Codex, to change the language, images, text and video.

Keep all files together. The `source.zip` package is for development; ordinary users should choose the Windows package.

## Languages and customization

**English is the default.** The settings interface supports English, Simplified Chinese, Traditional Chinese, Japanese and Russian. Select a language and click **Save and preview** to remember it on this device. Closing settings discards unsaved changes. Your own text is preserved when switching languages.

The opening sequence lasts about 12 seconds and can be skipped with Esc. The character video then plays once, pauses while the window is hidden, and fades out to restore the previous appearance when it ends.

Images can be up to 30 MiB; MP4 / WebM videos up to 64 MiB. H.264 MP4 is recommended. The opening images and subsequent video are configured separately. Personal imports stay on this device. The bundled video is silent.

To restore the interface, use **Turn off styling and restore Codex**. Fully quit Codex and reopen it from its official icon to return to a normal session. The official installation and shortcuts are unchanged.

## Requirements

Windows 10/11 x64, .NET Framework 4.x, and official Microsoft Store / MSIX Codex. The launcher reuses a signature-verified official Node runtime; users do not need to install Node, Python or FFmpeg separately.

The portable EXEs are unsigned local builds. The integration opens a random loopback debugging port that remains available to local processes until Codex exits. Launcher diagnostics are in English; the animation and settings use your selected language.

## Development

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

Tests need Node 22+. Building uses the Windows .NET Framework compiler. Outputs are written to `release/`; use a new `-OutputDirectory` for repeat builds. Each language has a local catalog in `locales/`, with English fallback and no translation service.

See [development notes](docs/development.md) and [testing notes](docs/testing.md) (Chinese).

## Credits

Thanks to the following projects for their code and implementation ideas.

| Project | Contribution |
| --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | Direct code foundation: Windows launching, opening animation, image settings and window integration |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | Upstream timeline, image import, contour extraction and temporary page integration |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | Earlier upstream in the fork chain |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | Launch and window handoff reference |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | Appearance settings, transparent backgrounds and runtime handling reference |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | Startup animation and video playback ideas |

This project adds ChatGPT character artwork, a single-play character video, appearance restoration, multilingual settings and portable releases. Versions and changes are recorded in [third-party notices](THIRD_PARTY_NOTICES.md).

## License

Original code, modifications and documentation use the [MIT License](LICENSE). See [third-party notices](THIRD_PARTY_NOTICES.md) for inherited code and [media notices](media/MEDIA_NOTICE.md) for the bundled images and video.

An unofficial community project, not affiliated with OpenAI.
