# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

Amethystは、ObsidianのメモをHugoで公開するためのHugoテーマです。QuartzとHugo Bookテーマを組み合わせて、Obsidianのメモをそのまま公開できるように設計されています。

## よく使用するコマンド

### 開発サーバーの起動
```bash
make serve
```
- ローカルサーバーを起動 (デフォルト: http://localhost:1313)
- hugo-obsidianコマンドを実行してインデックスファイルを生成後、Hugoサーバーを起動
- ナビゲーション（内部リンクやサイドバーメニュー）の変更をプレビューするには、サーバーの再起動が必要

### 依存関係の更新
```bash
make update
```
- hugo-obsidianを最新版に更新
- Quartzの上流リポジトリから最新の変更を取得

### Dockerを使用したローカル起動
```bash
make docker
```

## アーキテクチャとファイル構造

### テーマの主要コンポーネント

1. **Hugo Bookベースのナビゲーション** - 左サイドバーでのファイルツリー表示
2. **Quartzの統合機能** - Obsidianスタイルのバックリンク、グラフビュー、プレビュー
3. **SCSSベースのスタイルシステム** - カスタマイズ可能なテーマ設定

### 重要なディレクトリ

- `assets/` - SCSS スタイルファイルとJavaScript
  - `_amethyst.scss` - メインテーマファイル
  - `_colors.scss` - カラーテーマ設定
  - `_variables.scss` - SCSS変数
  - `_custom.scss` - カスタムスタイル
  - `quartz/` - Quartzから移植したスタイルとスクリプト
- `layouts/` - Hugoテンプレートファイル
  - `partials/docs/` - メインドキュメントパーシャル
  - `partials/quartz/` - Quartzから移植した機能のパーシャル
- `i18n/` - 多言語対応ファイル
- `static/` - 静的ファイル（フォント、アイコン、KaTeX、Mermaid）

### 設定ファイル

- `config.yaml` - メインのHugo設定
- `data/graphConfig.yaml` - グラフビューの設定
- `theme.toml` - テーマメタデータ

### カスタマイズポイント

1. **スタイルのカスタマイズ**
   - `assets/_custom.scss` - カスタムスタイルの追加
   - `assets/_colors.scss` - カラースキームの変更
   - `assets/_fonts.scss` - フォント設定

2. **プラグイン**
   - `assets/plugins/_numbered.scss` - 見出しの番号付け
   - `assets/plugins/_scrollbars.scss` - スクロールバーのスタイル

3. **レイアウトの拡張**
   - `layouts/partials/docs/inject/` - HTMLの挿入ポイント

### 技術的な依存関係

- **Hugo 0.93+** 必須
- **Go 1.16+** 必須
- **hugo-obsidian** - Obsidianスタイルのリンク処理とインデックス生成
- **KaTeX** - 数式レンダリング
- **Mermaid** - 図表作成
- **flexsearch** - 検索機能

### 多言語対応

テーマは多言語対応しており、`i18n/`ディレクトリに20以上の言語ファイルがあります。新しい言語を追加する場合は、既存のファイルを参考にしてください。