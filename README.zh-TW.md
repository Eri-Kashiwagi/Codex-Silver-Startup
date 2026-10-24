# Codex Silver Startup · ChatGPT 娘化開場動畫
[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

以 **ChatGPT 娘化形象** 為主題，為 Windows Codex 加入開場動畫與進入後的角色影片。完整解壓縮可攜版，按兩下 **Start Codex.exe** 即可使用內附素材，也能換成自己的圖片和影片。

[下載 Windows 可攜版](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases/latest) · [原始碼](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup)

## 開始使用

1. 安裝 Microsoft Store / MSIX 版官方 Codex，並至少開啟一次以完成初始化。
2. 下載檔名以 `windows-x64.zip` 結尾的檔案。在 ZIP「內容」中選擇解除封鎖（若有此選項），再完整解壓縮至固定資料夾。
3. 儲存工作，從選單或系統匣完全結束 Codex。
4. 按兩下 **Start Codex.exe**。
5. 開啟 **Animation Settings.exe**，或在 Codex 中按 **Ctrl+Alt+B**，調整語言、圖片、文字與影片。

請保留整個資料夾。`source.zip` 是供開發使用的原始碼套件；一般使用者選擇 Windows 可攜版即可。

## 語言與動畫設定

**預設語言為英語。** 設定介面支援英語、簡體中文、繁體中文、日語及俄語。在 **Language** 中選擇語言，點擊「儲存並預覽」即可記住選擇。關閉設定會捨棄未儲存的變更；切換語言不會翻譯或覆蓋自訂歡迎語。

開場約 12 秒，可按 Esc 略過。進入聊天介面後，角色影片播放一次，結束時淡出並恢復原有外觀。開場動畫與角色影片在背景或視窗隱藏時仍繼續推進，返回時對齊實際經過的時間。手動暫停與開啟設定仍會暫停播放。

圖片上限 30 MiB，MP4 / WebM 影片上限 64 MiB，建議使用 H.264 MP4。開場圖片與進入後的影片分別設定，個人素材儲存在本機。內附影片沒有聲音。

在設定中點擊「關閉美化，恢復 Codex 外觀」即可還原介面。完全結束 Codex 後從官方圖示重新開啟，可恢復一般工作階段。程式不修改官方安裝目錄或捷徑。

## 環境需求

Windows 10/11 x64、.NET Framework 4.x，以及 Microsoft Store / MSIX 版官方 Codex。程式使用經簽章檢查的官方 Node 環境，不需另外安裝 Node、Python 或 FFmpeg。

啟動 EXE 是未簽章的本機建置版本。整合透過隨機回環偵錯連接埠運作；該連接埠會保留至 Codex 結束，同機處理程序可存取。啟動器診斷訊息使用英語，動畫與設定介面使用所選語言。

## 開發與建置

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

測試需 Node 22+，建置使用 Windows .NET Framework 編譯器。產物位於 `release/`；重複建置請指定新的 `-OutputDirectory`。各語言文案放在 `locales/`，缺少翻譯時回退至英語，不需連線翻譯。

詳見[開發說明](docs/development.md)與[測試說明](docs/testing.md)（簡體中文）。

## 來源與致謝

| 專案 | 貢獻 |
| --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | 直接程式碼基礎：Windows 啟動、開場動畫、圖片設定與視窗整合 |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | 上游時間軸、圖片匯入、輪廓擷取與暫時頁面整合 |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | fork 鏈中更早的上游 |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | 啟動與視窗交接參考 |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | 外觀設定、透明背景與執行環境處理參考 |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | 開場動畫與影片播放構想參考 |

本專案加入 ChatGPT 娘化素材、單次角色影片、外觀還原、多語言設定與可攜版套件。版本及修改範圍見[來源說明](THIRD_PARTY_NOTICES.md)。

## 授權與素材

原創程式碼、修改與文件採用 [MIT License](LICENSE)。第三方程式碼見[來源說明](THIRD_PARTY_NOTICES.md)，內附圖片與影片見[素材說明](media/MEDIA_NOTICE.md)。

本專案是非官方社群工具，與 OpenAI 無官方關聯。
