# テスト用検証データ

実際に出力したCSVをもとに、今後のテストで再利用できる検証データを作成する。

## 対象fixture

- `tests/fixtures/practice-match-7game-anonymized.csv`
  - 7ゲームマッチ、43ポイント分のCSV
  - 実名に近い選手名、大会名、会場名はテスト用名称へ置換済み
  - CSV出力形式の列構成を保持

- `tests/fixtures/practice-match-7game-expected.json`
  - CSVから期待される集計値
  - 得点側、サービスサイド、ポイント内容、ゲーム取得、個人別 `+ / -`、ゲームの1ポイント目、連続得点を保持

- `tests/fixture-csv.test.js`
  - fixture CSVを読み込み、期待値JSONと照合する単体テスト
  - 匿名化漏れがないことも確認する

- `tests/fixture-analysis-regression.test.js`
  - fixture CSVをアプリ内部の `state.points` 相当に変換する
  - `getAnalysisData()`、サマリー図解用データ、個人別 `+ / -`、1ポイント目取得率、サマリー画像ページ数を期待値JSONと照合する

- `tests/fixtures/practice-match-corpus-expected.json`
  - 追加CSV fixtureの期待値
  - 46ポイント、28ポイント、1ポイントの3パターンを保持
  - 完全一致した重複CSVは採用対象から外したことを記録

- `tests/fixtures/practice-match-7game-extended-anonymized.csv`
  - 7ゲームマッチ、46ポイント分のCSV
  - 自チーム3ゲーム、相手4ゲームの試合終了寄りデータ
  - 長い連続得点、連続失点、ゲーム取得の検証に使う

- `tests/fixtures/practice-match-7game-midgame-anonymized.csv`
  - 7ゲームマッチ、28ポイント分のCSV
  - 試合途中データとして、未完了状態の集計確認に使う

- `tests/fixtures/practice-match-1point-anonymized.csv`
  - 1ポイントだけの最小CSV
  - CSV出力直後や入力が少ない状態でもテストが壊れないことを確認する

- `tests/fixture-corpus.test.js`
  - 追加fixture群を読み込み、列構成、件数、得点側、ゲーム取得、個人別 `+ / -`、連続得点を照合する
  - 元データ由来の固有名詞が残っていないことも確認する

## 注意

元CSVは個人名に近い情報を含むため、Git管理には入れない。
Gitに入れるのは匿名化済みfixtureのみとする。

今回確認した5本のうち、`20260601124232` と `20260601124253` は完全一致だったため、fixtureとしては `20260601124253` 由来の1本だけを採用する。

## 今後の使い方

- CSV出力仕様を変更した時は、このfixtureテストを先に確認する
- 分析ロジックを変更した時は、期待値JSONの数字と差分を確認する
- 実機フィードバックで新しい典型ケースが出たら、別fixtureとして追加する
