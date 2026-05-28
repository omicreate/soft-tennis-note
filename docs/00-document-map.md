# ドキュメント一覧

最終更新: 2026-05-28

このフォルダは、ソフトテニス試合ノートの開発内容を後から見返せるように整理したものです。

個人開発ではここまで細かく書かないことも多いですが、今後ほかのスポーツや別アプリへ横展開する前提で、要件、設計、テスト、運用を分けて残します。

## 読む順番

1. `requirements.md`
   - 何を作るか
   - 誰が使うか
   - どの課題を解決するか

2. `basic-design.md`
   - どのような方式で作るか
   - 画面、保存、オフライン、公開方法の考え方

3. `detailed-design.md`
   - JavaScript内の主なデータ構造
   - スコア計算、分析、保存、サマリー出力の細かい考え方

4. `test-design.md`
   - 何をテストすべきか
   - 正常系、異常系、スマホ確認、リリース前確認

5. `device-test-checklist.md`
   - iPhone、Androidの実機で何を確認するか
   - 共有、保存、オフライン、画面見切れの確認観点

6. `../TEST_REPORT.md`
   - 実際に何を確認したか
   - どのバージョンでOKだったか

7. `deployment.md`
   - 検証環境と本番環境への反映手順

8. `expansion-roadmap.md`
   - ピックルボール、テニス、ほかのソフトテニスアプリへ広げる時の考え方

## ファイルの役割

| ファイル | 役割 |
| --- | --- |
| `requirements.md` | 要件定義 |
| `basic-design.md` | 基本設計、方式設計 |
| `detailed-design.md` | 詳細設計 |
| `test-design.md` | テスト設計 |
| `device-test-checklist.md` | 実機確認チェックリスト |
| `requirements-design.md` | 既存の統合版設計書。今後は上記ファイルへ分割して管理 |
| `deployment.md` | 公開、検証、本番反映の運用手順 |
| `project-structure.md` | ローカルフォルダ、GitHub、各ファイルの説明 |
| `expansion-roadmap.md` | 横展開、今後作りたいアプリの方向性 |
| `technical-review.md` | 技術レビュー、改善バックログ |

## 更新ルール

- 機能を追加したら `requirements.md` と `basic-design.md` を確認する
- データ構造や集計ロジックを変えたら `detailed-design.md` を更新する
- テスト観点を増やしたら `test-design.md` を更新する
- 実際の確認結果は `TEST_REPORT.md` に残す
- 公開手順や環境を変えたら `deployment.md` を更新する
- 将来アイデアは `expansion-roadmap.md` に残す
