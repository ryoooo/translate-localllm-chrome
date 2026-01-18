# Local LLM Translator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

LM Studioで動作するローカルLLMを使用して、英語ウェブページを日本語に翻訳するChrome拡張機能。

> **GitHub**: https://github.com/ryoooo/translate-localllm-chrome

## 特徴

- ページ全体の翻訳（段落ごとに逐次処理）
- 元テキストを日本語に置換表示
- 複数エンドポイント（LLMサーバー）の登録・切り替え
- モデルごとのプロンプトテンプレート設定
- ツールバーアイコンおよびコンテキストメニューからの起動

## 対応モデル

- [TranslateGemma-12B-IT-GGUF](https://huggingface.co/bullerwins/translategemma-12b-it-GGUF) - Google Translate研究チームによる55言語対応の翻訳モデル
- [PLaMo-2-Translate](https://huggingface.co/pfnet/plamo-2-translate) - Preferred Networks製の英日特化翻訳モデル

## インストール

### 前提条件

- [Bun](https://bun.sh/) v1.0以上
- [LM Studio](https://lmstudio.ai/) または互換APIサーバー
- Chrome / Chromium系ブラウザ

### ビルド

```bash
# 依存関係のインストール
bun install

# ビルド
bun run build
```

### Chrome拡張機能として読み込み

1. Chromeで `chrome://extensions` を開く
2. 「デベロッパーモード」を有効化
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `dist/` フォルダを選択

## 使い方

### 1. LM Studioの準備

1. LM Studioを起動
2. 翻訳モデル（TranslateGemmaなど）をダウンロード
3. サーバーを起動（デフォルト: `http://localhost:1234`）

### 2. エンドポイント設定

1. 拡張機能アイコンを右クリック → 「オプション」
2. 「+ 追加」でエンドポイントを登録
   - **名前**: 任意の識別名
   - **URL**: `http://localhost:1234/v1/completions`（Completions API）または `http://localhost:1234/v1/chat/completions`（Chat API）
   - **API種類**: `Completions`（TranslateGemma推奨）または `Chat Completions`（一般的なモデル用）
   - **モデル名**: LM Studioで設定したモデル名
   - **プロンプトテンプレート**: プリセットから選択または自作

> **注意**: TranslateGemmaモデルは特殊なjinjaテンプレートを使用するため、Completions APIを選択してください。Chat Completions APIを使用するとエラーになる場合があります。

### 3. 翻訳実行

- **方法1**: ツールバーの拡張機能アイコンをクリック → 「このページを翻訳」
- **方法2**: ページ上で右クリック → 「このページを翻訳」

## 開発

```bash
# 開発モード（ファイル変更を監視）
bun run dev

# テスト実行
bun test

# 型チェック
bun run typecheck

# リント
bun run lint

# フォーマット
bun run format
```

## プロジェクト構成

```
src/
├── lib/
│   ├── types.ts              # 共有型定義
│   ├── storage.ts            # Chrome Storage操作
│   ├── storage.test.ts       # storageのテスト
│   ├── prompt-builder.ts     # プロンプト生成
│   ├── prompt-builder.test.ts
│   ├── api-client.ts         # LM Studio API呼び出し
│   └── api-client.test.ts
├── background/
│   └── service-worker.ts     # バックグラウンド処理
├── content/
│   └── content-script.ts     # DOM操作・テキスト抽出
├── popup/
│   ├── popup.html
│   ├── popup.css
│   └── popup.ts              # ポップアップUI
└── options/
    ├── options.html
    ├── options.css
    └── options.ts            # 設定UI
```

## プロンプトテンプレート

### 変数

- `{{text}}` - 翻訳対象テキスト
- `{{sourceLang}}` - 原言語（デフォルト: en）
- `{{targetLang}}` - 目的言語（デフォルト: ja）

### TranslateGemma用

```
Translate the following English text to Japanese. Output only the translation, nothing else.

{{text}}
```

### PLaMo-2-Translate用

```
<|plamo:op|>dataset
translation
<|plamo:op|>input lang={{sourceLang}}
{{text}}
<|plamo:op|>output lang={{targetLang}}
```

## 技術スタック

- TypeScript
- Bun（ビルド・パッケージ管理）
- Biome（リンター・フォーマッター）
- Chrome Extension Manifest V3

## ライセンス

MIT
