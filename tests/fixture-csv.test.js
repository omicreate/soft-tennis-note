const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const fixturePath = path.join("tests", "fixtures", "practice-match-7game-anonymized.csv");
const expectedPath = path.join("tests", "fixtures", "practice-match-7game-expected.json");
const csvText = fs.readFileSync(fixturePath, "utf8");
const expected = JSON.parse(fs.readFileSync(expectedPath, "utf8"));

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
  return rows.filter((line) => line.some(Boolean)).map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])));
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] || 0) + 1;
    return acc;
  }, {});
}

function playerPlusMinus(rows) {
  const scoring = new Set(["ストローク得点", "ボレー得点", "スマッシュ得点", "サービス得点", "レシーブ得点", "ロビング得点"]);
  const errors = new Set(["ダブルフォールト", "レシーブミス", "ストロークミス", "ボレーミス", "スマッシュミス", "その他"]);
  return rows.reduce((acc, row) => {
    const name = row["誰のプレー"];
    acc[name] ||= { points: 0, plus: 0, minus: 0, diff: 0 };
    acc[name].points += 1;
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
    if (!current || current.side !== winner) {
      if (current) streaks.push(current);
      current = { side: winner, count: 1, startNo: number, endNo: number, outcomes: { [row["ポイント内容"]]: 1 } };
    } else {
      current.count += 1;
      current.endNo = number;
      current.outcomes[row["ポイント内容"]] = (current.outcomes[row["ポイント内容"]] || 0) + 1;
    }
  });
  if (current) streaks.push(current);
  const top = streaks.filter((item) => item.side === side).sort((a, b) => b.count - a.count || a.startNo - b.startNo)[0];
  const topOutcome = Object.entries(top.outcomes).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  return { side: top.side, count: top.count, startNo: top.startNo, endNo: top.endNo, topOutcome };
}

const rows = parseCsv(csvText);
assert.equal(rows.length, expected.summary.rowCount, "fixture CSVの件数が期待値と一致する");
assert.equal(rows[0]["試合形式"], expected.match.format, "試合形式を保持する");
assert.equal(rows[0]["大会名"], "検証練習試合", "大会名は匿名化する");
assert.equal(rows[0]["開催地／会場"], "検証会場", "会場名は匿名化する");
assert.deepEqual([...new Set(rows.map((row) => row["誰のプレー"]))].sort(), expected.privacy.anonymizedPlayerLabels.sort(), "fixtureの選手名は匿名化ラベルだけにする");

assert.deepEqual(countBy(rows, "得点側"), expected.counts.winners, "得点側の内訳が期待値と一致する");
assert.deepEqual(countBy(rows, "サービスサイド"), expected.counts.servers, "サービスサイドの内訳が期待値と一致する");
assert.deepEqual(countBy(rows, "ポイント内容"), expected.counts.outcomes, "ポイント内容の内訳が期待値と一致する");
assert.deepEqual(countBy(rows, "ゲーム取得"), expected.counts.gameWonBy, "ゲーム取得の内訳が期待値と一致する");

const plusMinus = playerPlusMinus(rows);
Object.entries(expected.players).forEach(([name, value]) => {
  assert.deepEqual(
    plusMinus[name],
    { points: value.points, plus: value.plus, minus: value.minus, diff: value.diff },
    `${name} の個人別+/-が期待値と一致する`
  );
});

const openings = rows.filter((row) => row["ポイント"] === "0-0");
assert.equal(openings.length, expected.flow.gameOpeningPoints, "ゲームの1ポイント目件数が期待値と一致する");
assert.deepEqual(countBy(openings, "得点側"), expected.flow.gameOpeningWinners, "ゲームの1ポイント目取得側が期待値と一致する");
assert.deepEqual(longestStreak(rows, "自チーム"), expected.flow.longestOwnStreak, "自チーム最長連続得点が期待値と一致する");
assert.deepEqual(longestStreak(rows, "相手ペア"), expected.flow.longestOpponentStreak, "相手最長連続得点が期待値と一致する");

assert.equal(expected.summary.finalGameScore, "4-1", "7ゲームマッチの検証データとして最終ゲームスコアを固定する");
console.log("fixture-csv: ok");
