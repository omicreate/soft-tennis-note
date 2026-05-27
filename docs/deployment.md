# 公開・テスト環境の運用メモ

## URLの考え方

本番用:

- GitHubリポジトリ: `omicreate/soft-tennis-note`
- 公開URL: `https://omicreate.github.io/soft-tennis-note/`
- 用途: 学生・保護者・テスト協力者へ案内するURL

テスト用:

- GitHubリポジトリ: `omicreate/soft-tennis-note-preview`
- 公開URL: `https://omicreate.github.io/soft-tennis-note-preview/`
- 用途: リリース前に自分のスマホで確認するURL

## 基本方針

- PC内の `/Users/omi/Documents/Apps/soft-tennis-note` を本番の元データとして扱う
- PC内の `/Users/omi/Documents/Apps/soft-tennis-note-preview` をテスト公開用として扱う
- 先にテスト用URLで確認し、問題がなければ本番用へ反映する
- GitHub上で直接編集せず、PC側で編集してからGitHubへ反映する

## 通常の流れ

1. `soft-tennis-note` で修正する
2. ローカルで動作確認する
3. テストが通ることを確認する
4. `CHANGELOG.md` と必要なMarkdownを更新する
5. `index.html` の読み込みバージョンと `sw.js` のキャッシュ名をそろえる
6. `soft-tennis-note-preview` に同じ内容を反映する
7. `soft-tennis-note-preview` をPushする
8. スマホで `https://omicreate.github.io/soft-tennis-note-preview/` を確認する
9. 問題なければ `soft-tennis-note` をPushする
10. スマホで `https://omicreate.github.io/soft-tennis-note/` を確認する

## バージョン確認

ブラウザ上では、画面下部とメニュー内の `バージョン情報` で現在の版を確認する。  
公開URLのHTMLでは、`app.js?v=数字` と `styles.css?v=数字` が最新になっているかを見る。

## GitHub側で最初に必要な作業

`soft-tennis-note-preview` はGitHub上で一度だけ作成する。

推奨設定:

- Repository name: `soft-tennis-note-preview`
- Visibility: `Public`
- README作成: なし
- `.gitignore` 作成: なし
- License作成: なし

作成後、GitHub Pagesを有効にする。

- Settings
- Pages
- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/root`
- Save

## 注意点

- テスト用URLもPublicにすると、URLを知っている人はアクセスできる
- ただし通常は検索や案内をしない限り見つかりにくい
- 個人情報や秘密情報はアプリ内に埋め込まない
- 本番URLを案内する前に、SafariまたはChromeで一度確認する

## テスト利用者への案内文

スマホのSafariまたはChromeで開いてください。LINE内ブラウザでは画像保存やデータ保存が不安定になる場合があります。記録データは使っている端末・ブラウザ内に保存され、開発者側へ自動送信されません。
