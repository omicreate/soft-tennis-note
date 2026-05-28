# ローカルファイル構成・管理ルール

最終更新: 2026-05-28

## 1. フォルダ全体

```text
/Users/omi/Documents/Apps/
├── soft-tennis-note/
└── soft-tennis-note-preview/
```

| フォルダ | 役割 |
| --- | --- |
| `soft-tennis-note` | 本番用。PC内の正本 |
| `soft-tennis-note-preview` | 検証環境用。本番前に公開確認する場所 |

## 2. 本番フォルダの構成

```text
soft-tennis-note/
├── index.html
├── app.js
├── styles.css
├── sw.js
├── manifest.webmanifest
├── README.md
├── CHANGELOG.md
├── TEST_REPORT.md
├── TERMS.md
├── docs/
│   ├── 00-document-map.md
│   ├── requirements.md
│   ├── basic-design.md
│   ├── detailed-design.md
│   ├── test-design.md
│   ├── project-structure.md
│   ├── expansion-roadmap.md
│   ├── technical-review.md
│   ├── deployment.md
│   └── requirements-design.md
└── tests/
    ├── analysis-counts.test.js
    └── match-flow.test.js
```

## 3. アプリ本体

| ファイル | 内容 |
| --- | --- |
| `index.html` | 画面の土台。タブ、メニュー、入力欄、ダイアログなど |
| `app.js` | アプリの中心。スコア、記録、分析、保存、サマリー、CSV |
| `styles.css` | 見た目。スマホ対応、色、余白、ボタン、スコア表示 |
| `sw.js` | オフライン対応。Service Workerとキャッシュ |
| `manifest.webmanifest` | ホーム画面追加などPWA向け設定 |

## 4. ドキュメント

| ファイル | 内容 |
| --- | --- |
| `README.md` | アプリ概要、使い方、公開URL |
| `CHANGELOG.md` | 更新履歴 |
| `TEST_REPORT.md` | 実際のテスト結果 |
| `TERMS.md` | 利用条件、免責、権利関係 |
| `docs/00-document-map.md` | ドキュメントの読み方 |
| `docs/requirements.md` | 要件定義 |
| `docs/basic-design.md` | 基本設計、方式設計 |
| `docs/detailed-design.md` | 詳細設計 |
| `docs/test-design.md` | テスト設計 |
| `docs/deployment.md` | 公開、検証、本番反映手順 |
| `docs/project-structure.md` | このファイル。ローカル構造と管理ルール |
| `docs/expansion-roadmap.md` | 他スポーツ、別アプリへの横展開メモ |
| `docs/technical-review.md` | 技術レビュー、改善バックログ |
| `docs/requirements-design.md` | 既存の統合版設計書 |

## 5. テスト

| ファイル | 内容 |
| --- | --- |
| `tests/analysis-counts.test.js` | 分析集計の確認 |
| `tests/match-flow.test.js` | 試合進行、得点、終了、取り消しの確認 |

## 6. 変更時の基本ルール

### 6.1 機能を変えた時

更新候補:

- `app.js`
- `index.html`
- `styles.css`
- `CHANGELOG.md`
- `docs/requirements.md`
- `docs/basic-design.md`
- `docs/detailed-design.md`
- `TEST_REPORT.md`

### 6.2 見た目だけ変えた時

更新候補:

- `styles.css`
- `CHANGELOG.md`
- `TEST_REPORT.md`

### 6.3 分析ロジックを変えた時

更新候補:

- `app.js`
- `docs/detailed-design.md`
- `docs/test-design.md`
- `TEST_REPORT.md`

### 6.4 公開手順を変えた時

更新候補:

- `docs/deployment.md`
- `README.md`

## 7. リリース時の基本ルール

1. 本番フォルダ `soft-tennis-note` で修正する
2. テストを実行する
3. 必要なMarkdownを更新する
4. 検証フォルダ `soft-tennis-note-preview` に同期する
5. 検証環境へPushする
6. 検証URLで確認する
7. 本番環境へPushする
8. 本番URLで確認する

## 8. Git管理

Gitで管理するもの:

- アプリ本体
- ドキュメント
- テストコード

Gitで管理しないもの:

- `.DS_Store`
- 一時ログ
- `node_modules`
- 個人の実試合CSV
- 個人情報を含むテストデータ

## 9. 今後ほかのアプリを作る時の推奨フォルダ

```text
/Users/omi/Documents/Apps/
├── soft-tennis-note/
├── soft-tennis-note-preview/
├── pickleball-note/
├── pickleball-note-preview/
├── tennis-note/
└── tennis-note-preview/
```

各アプリで、本番用と検証用を分ける。

共通ルール:

- 本番フォルダを正本にする
- 検証フォルダは公開前確認用にする
- ドキュメントを残す
- テスト結果を残す
- GitHubに反映する前にローカルで確認する
