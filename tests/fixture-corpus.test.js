const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const expected = JSON.parse(fs.readFileSync(path.join("tests", "fixtures", "practice-match-corpus-expected.json"), "utf8"));
const fixtureDir = path.join("tests", "fixtures");
const stableHeaders = [
  "No",
  "日付",
  "時間帯",
  "開始時刻",
  "終了時刻",
  "天気",
  "気温",
  "風",
  "風向き",
  "コート種別",
  "コート状態",
  "種別",
  "相手基本布陣",
  "区分",
  "大会名",
  "開催地／会場",
  "コート",
  "試合形式",
  "得点側",
  "サービスサイド",
  "ゲーム",
  "ポイント",
  "場面",
  "サービスの入り方",
  "ポイント内容",
  "ボールの結果",
  "誰のプレー",
  "ショット",
  "打球面",
  "コース",
  "ラリー数",
  "ゲーム取得",
  "メモ",
  "記録時刻"
];
const scoring = new Set(["ストローク得点", "ボレー得点", "スマッシュ得点", "サービス得点", "レシーブ得点", "ロビング得点"]);
const errors = new Set(["ダブルフォールト", "レシーブミス", "ストロークミス", "ボレーミス", "スマッシュミス", "その他"]);
const allowedPlayerLabels = new Set(["自後衛A", "自前衛A", "相手後衛B", "相手前衛B", "不明"]);

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ""));
    rows.push(row);
  }

  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, ""));
  return {
    headers,
    rows: rows.filter((line) => line.some(Boolean)).map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])))
  };
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function playerPlusMinus(rows) {
  return rows.reduce((acc, row) => {
    const name = row["誰のプレー"] || "不明";
    acc[name] ||= { points: 0, plus: 0, minus: 0, diff: 0, outcomes: {} };
    acc[name].points += 1;
    acc[name].outcomes[row["ポイント内容"]] = (acc[name].outcomes[row["ポイント内容"]] || 0) + 1;
    if (scoring.has(row["ポイント内容"])) acc[name].plus += 1;
    if (errors.has(row["ポイント内容"])) acc[name].minus += 1;
    acc[name].diff = acc[name].plus - acc[name].minus;
    return acc;
  }, {});
}

function longestStreak(rows, side) {
  const streaks = [];
  let current = null;
  rows.forEach((row) => {
    const number = Number(row.No);
    const winner = row["得点側"];
    const outcome = row["ポイント内容"];
    if (!current || current.side !== winner) {
      if (current) streaks.push(current);
      current = { side: winner, count: 1, startNo: number, endNo: number, outcomes: { [outcome]: 1 } };
    } else {
      current.count += 1;
      current.endNo = number;
      current.outcomes[outcome] = (current.outcomes[outcome] || 0) + 1;
    }
  });
  if (current) streaks.push(current);
  const top = streaks.filter((item) => item.side === side).sort((a, b) => b.count - a.count || a.startNo - b.startNo)[0];
  if (!top) return null;
  const topOutcome = Object.entries(top.outcomes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  return { side: top.side, count: top.count, startNo: top.startNo, endNo: top.endNo, topOutcome };
}

assert.equal(expected.privacy.anonymized, true, "corpus fixtureは匿名化済みとして管理する");
assert.ok(expected.duplicates.length >= 1, "完全一致CSVは重複として記録する");

expected.fixtures.forEach((fixture) => {
  const csvPath = path.join(fixtureDir, fixture.file);
  const csvText = fs.readFileSync(csvPath, "utf8");
  const { headers, rows } = parseCsv(csvText);
  rows.forEach((row) => {
    assert.equal(row["大会名"], "検証練習試合", `${fixture.file} の大会名は検証用名称にする`);
    assert.equal(row["開催地／会場"], "検証会場", `${fixture.file} の会場名は検証用名称にする`);
    assert.ok(allowedPlayerLabels.has(row["誰のプレー"] || "不明"), `${fixture.file} の選手名は匿名化ラベルだけにする`);
  });
  assert.deepEqual(headers, stableHeaders, `${fixture.file} のCSV列構成が安定している`);
  assert.equal(rows.length, fixture.rowCount, `${fixture.file} の件数が期待値と一致する`);
  assert.deepEqual(countBy(rows, "得点側"), fixture.counts.winners, `${fixture.file} の得点側内訳が一致する`);
  assert.deepEqual(countBy(rows, "サービスサイド"), fixture.counts.servers, `${fixture.file} のサービスサイド内訳が一致する`);
  assert.deepEqual(countBy(rows, "ポイント内容"), fixture.counts.outcomes, `${fixture.file} のポイント内容内訳が一致する`);
  assert.deepEqual(countBy(rows, "ゲーム取得"), fixture.counts.gameWonBy, `${fixture.file} のゲーム取得内訳が一致する`);
  assert.deepEqual(playerPlusMinus(rows), fixture.players, `${fixture.file} の個人別+/-が一致する`);
  assert.deepEqual(longestStreak(rows, "自チーム"), fixture.flow.longestOwnStreak, `${fixture.file} の自チーム連続得点が一致する`);
  assert.deepEqual(longestStreak(rows, "相手ペア"), fixture.flow.longestOpponentStreak, `${fixture.file} の相手連続得点が一致する`);
});

console.log("fixture-corpus: ok");
