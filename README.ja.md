# Codex Silver Startup · ChatGPT 擬人化アニメーション
[English](README.md) | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md) | [日本語](README.ja.md) | [Русский](README.ru.md)

ChatGPT を女の子のキャラクターとして表現した、**Windows Codex** 向けの起動アニメーションとキャラクター動画です。ポータブル版を展開して **Start Codex.exe** を実行すると、付属の画像と動画を使用できます。自分の素材にも変更できます。

[Windows 版をダウンロード](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup/releases/latest) · [ソースコード](https://github.com/Eri-Kashiwagi/Codex-Silver-Startup)

## 使い方

1. Microsoft Store / MSIX 版の公式 Codex をインストールし、一度起動して初期設定を完了します。
2. 名前が `windows-x64.zip` で終わるファイルをダウンロードします。ZIP のプロパティにブロック解除の項目があれば解除し、フォルダー全体を展開します。
3. 作業を保存し、メニューまたは通知領域から Codex を完全に終了します。
4. **Start Codex.exe** をダブルクリックします。
5. **Animation Settings.exe**、または Codex 内の **Ctrl+Alt+B** で、言語・画像・テキスト・動画を変更できます。

ファイルは同じフォルダーにまとめておいてください。`source.zip` は開発用です。通常は Windows ポータブル版を選択してください。

## 言語とカスタマイズ

**初期言語は英語です。** 英語、簡体字中国語、繁体字中国語、日本語、ロシア語に対応しています。**Language** で言語を選び、「保存してプレビュー」を押すと選択を保存します。保存せずに閉じると変更を破棄します。自分で入力したテキストは、言語を切り替えてもそのまま残ります。

起動アニメーションは約 12 秒で、Esc でスキップできます。その後、キャラクター動画を一度再生します。ウィンドウを非表示にすると一時停止し、戻ると再開します。終了後はフェードアウトして元の外観に戻ります。

画像は 30 MiB 以下、MP4 / WebM 動画は 64 MiB 以下です。H.264 MP4 を推奨します。開場画像と起動後の動画は個別に設定でき、個人の素材はデバイス内に保存されます。付属動画は無音です。

設定の「カスタマイズをオフにして Codex の外観を戻す」で外観を復元できます。通常のセッションに戻すには、Codex を完全に終了し、公式アイコンから起動してください。公式インストール先やショートカットは変更しません。

## 必要環境

Windows 10/11 x64、.NET Framework 4.x、Microsoft Store / MSIX 版の公式 Codex。署名を確認した公式 Node ランタイムを使用するため、Node、Python、FFmpeg を別途インストールする必要はありません。

EXE はローカルでビルドした未署名のファイルです。統合にはランダムなループバックのデバッグポートを使用します。このポートは Codex の終了まで開いたままで、同じ PC のプロセスからアクセスできます。ランチャーの診断情報は英語、アニメーションと設定画面は選択した言語で表示します。

## 開発とビルド

```powershell
node --test tools/*.test.mjs
powershell -NoProfile -File tools/build-release.ps1
powershell -NoProfile -File tools/verify-package.ps1
```

テストには Node 22+、ビルドには Windows の .NET Framework コンパイラーを使用します。出力先は `release/` です。再ビルド時は新しい `-OutputDirectory` を指定してください。翻訳は `locales/` の言語別ファイルで管理し、欠落時は英語を使用します。翻訳サービスへの通信はありません。

[開発ノート](docs/development.md)と[テストノート](docs/testing.md)は簡体字中国語です。

## 謝辞

| プロジェクト | 貢献 |
| --- | --- |
| [lilhuu/Codex-Startup-Windows](https://github.com/lilhuu/Codex-Startup-Windows) | 直接のコード基盤：Windows 起動、アニメーション、画像設定、ウィンドウ統合 |
| [M1ddle0/codex-startup-animation](https://github.com/M1ddle0/codex-startup-animation) | 上流のタイムライン、画像読み込み、輪郭抽出、一時ページ統合 |
| [panding999/codex-startup-animation](https://github.com/panding999/codex-startup-animation) | fork 系列のさらに前の上流 |
| [yushua0808-cpu/dragon-codex-boot](https://github.com/yushua0808-cpu/dragon-codex-boot) | 起動とウィンドウ引き継ぎの参考 |
| [Fei-Away/Codex-Dream-Skin](https://github.com/Fei-Away/Codex-Dream-Skin) | 外観設定、透明背景、実行環境の扱いの参考 |
| [mytjxs/codex-startup-animation](https://github.com/mytjxs/codex-startup-animation) | 起動アニメーションと動画再生のアイデア |

本プロジェクトは、ChatGPT のキャラクター素材、一度再生する動画、元の外観への復元、多言語設定、ポータブル配布を追加しています。参照バージョンと変更範囲は[第三者の権利表記](THIRD_PARTY_NOTICES.md)をご覧ください。

## ライセンス

独自のコード、変更、ドキュメントは [MIT License](LICENSE) です。継承したコードは[第三者の権利表記](THIRD_PARTY_NOTICES.md)、付属の画像と動画は[素材について](media/MEDIA_NOTICE.md)をご確認ください。

OpenAI と公式な関係のない、非公式コミュニティプロジェクトです。
