const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");

function createElement(selector = "") {
  return {
    selector,
    dataset: selector === ".tab.active" ? { tab: "analysis" } : {},
    value: "",
    textContent: "",
    innerHTML: "",
    hidden: false,
    title: "",
    style: {},
    classList: { toggled: {}, toggle(name, force) { this.toggled[name] = force; } },
    addEventListener() {},
    focus() {},
    scrollIntoView() {},
    showModal() {},
    close() {},
    click() {},
    closest() { return null; }
  };
}

function createCanvasElement() {
  const calls = [];
  const context2d = {
    calls,
    fillStyle: "",
    strokeStyle: "",
    lineWidth: 1,
    font: "800 28px sans-serif",
    fillRect(x, y, width, height) { calls.push({ type: "fillRect", x, y, width, height }); },
    fillText(text, x, y) { calls.push({ type: "fillText", text: String(text), x, y, font: this.font }); },
    measureText(text) {
      const size = Number(this.font.match(/(\d+)px/)?.[1] || 28);
      return { width: String(text).length * size * 0.58 };
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arcTo() {},
    closePath() {},
    fill() { calls.push({ type: "fill", fillStyle: this.fillStyle }); },
    stroke() {}
  };
  return {
    width: 0,
    height: 0,
    getContext: () => context2d,
    toDataURL: () => "data:image/png;base64,TEST"
  };
}

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
  if (cell || row.length) row.push(cell.replace(/\r$/, "")), rows.push(row);
  const headers = rows.shift().map((header) => header.replace(/^\uFEFF/, ""));
  return rows.filter((line) => line.some(Boolean)).map((line) => Object.fromEntries(headers.map((header, index) => [header, line[index] ?? ""])));
}

function parseScore(value) {
  const [a, b] = String(value || "0-0").split("-").map((item) => Number(item) || 0);
  return { A: a, B: b };
}

function side(value) {
  return value === "自チーム" ? "A" : "B";
}

function playerKey(value) {
  return {
    自後衛A: "A後衛",
    自前衛A: "A前衛",
    相手後衛B: "B後衛",
    相手前衛B: "B前衛"
  }[value] || "不明";
}

const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, createElement(selector));
  return elements.get(selector);
}

const context = {
  console,
  Blob: function Blob() {},
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  crypto: { randomUUID: () => "test-id" },
  structuredClone,
  requestAnimationFrame: (callback) => callback(),
  window: { matchMedia: () => ({ matches: true }) },
  document: {
    body: createElement("body"),
    querySelector: element,
    querySelectorAll: () => [],
    createElement: (selector) => selector === "canvas" ? createCanvasElement() : createElement(selector)
  },
  localStorage: { getItem: () => null, setItem() {} },
  location: { protocol: "file:" },
  navigator: {},
  assert
};
vm.createContext(context);
vm.runInContext(
  `${fs.readFileSync("app-config.js", "utf8")}\n${fs.readFileSync("app-analysis.js", "utf8")}\n${fs.readFileSync("app-storage.js", "utf8")}\n${fs.readFileSync("app-rules.js", "utf8")}\n${fs.readFileSync("app.js", "utf8")}`,
  context,
  { filename: "app.js" }
);

const csvText = fs.readFileSync(path.join("tests", "fixtures", "practice-match-7game-anonymized.csv"), "utf8");
const expected = JSON.parse(fs.readFileSync(path.join("tests", "fixtures", "practice-match-7game-expected.json"), "utf8"));
const rows = parseCsv(csvText);
function rowsToFixturePoints(sourceRows) {
  return sourceRows.map((row) => ({
    winner: side(row["得点側"]),
    server: side(row["サービスサイド"]),
    course: row["コース"],
    outcome: row["ポイント内容"],
    result: row["ボールの結果"],
    serveStart: row["サービスの入り方"],
    serverPlayer: playerKey(row["サーブ選手"] || "不明"),
    receiverPlayer: playerKey(row["レシーブ選手"] || "不明"),
    hand: row["打球面"],
    player: playerKey(row["誰のプレー"]),
    shot: row["ショット"],
    rally: row["ラリー数"] || "0",
    phase: row["場面"],
    gameNumber: parseScore(row["ゲーム"]).A + parseScore(row["ゲーム"]).B + 1,
    gameWonBy: row["ゲーム取得"] ? side(row["ゲーム取得"]) : undefined,
    scoreBefore: {
      games: parseScore(row["ゲーム"]),
      points: parseScore(row["ポイント"])
    },
    scoreAfter: {
      games: parseScore(row["ゲーム"]),
      points: parseScore(row["ポイント"])
    },
    at: row["記録時刻"]
  }));
}
const points = rowsToFixturePoints(rows);

context.__fixturePoints = points;
context.__fixtureExpected = expected;
vm.runInContext(`
  state = structuredClone(defaultState);
  state.matchType = "doubles";
  state.matchFormat = "7";
  state.gamesToWin = 4;
  state.teams = { A: "自チーム", B: "相手ペア" };
  state.players = { ARear: "自後衛A", AFront: "自前衛A", BRear: "相手後衛B", BFront: "相手前衛B" };
  state.matchInfo = {
    ...state.matchInfo,
    date: __fixtureExpected.match.date,
    timeOfDay: __fixtureExpected.match.timeOfDay,
    startTime: __fixtureExpected.match.startTime,
    endTime: __fixtureExpected.match.endTime,
    weather: __fixtureExpected.match.weather,
    temperature: __fixtureExpected.match.temperature,
    wind: __fixtureExpected.match.wind,
    surface: __fixtureExpected.match.surface,
    courtCondition: __fixtureExpected.match.courtCondition,
    opponentFormation: __fixtureExpected.match.formation,
    event: __fixtureExpected.match.event,
    tournament: __fixtureExpected.match.tournament,
    venueName: __fixtureExpected.match.venue,
    venue: __fixtureExpected.match.court
  };
  state.points = __fixturePoints;
  state.games = { A: __fixtureExpected.summary.ownGamesWon, B: __fixtureExpected.summary.opponentGamesWon };
  state.gamePoints = { A: 0, B: 0 };
  state.finished = true;
`, context);

const data = JSON.parse(JSON.stringify(vm.runInContext("getAnalysisData()", context)));
const expectedAnalysis = expected.appAnalysis;
[
  "total",
  "ownPoints",
  "ownLost",
  "pointDiff",
  "pointRate",
  "ownScoredByPattern",
  "ownPointsByOpponentError",
  "ownLostByOwnError",
  "firstServeRate",
  "secondServeStarts",
  "ownDoubleFaults",
  "ownReceiveMisses",
  "ownEarlyLost"
].forEach((key) => assert.equal(data[key], expectedAnalysis[key], `${key} がfixture期待値と一致する`));
assert.deepEqual(data.topScore, expectedAnalysis.topScore, "最多得点パターンがfixture期待値と一致する");
assert.deepEqual(data.topError, expectedAnalysis.topError, "最多失点ミスがfixture期待値と一致する");
assert.deepEqual(data.topPlayer, expectedAnalysis.topPlayer, "最多プレイヤーがfixture期待値と一致する");

const summary = JSON.parse(JSON.stringify(vm.runInContext("getSummaryImageData()", context)));
assert.deepEqual(summary.pointBreakdownRows, expectedAnalysis.pointBreakdownRows, "サマリー図解用の得点/失点内訳が期待値と一致する");
assert.deepEqual(summary.playerPlusMinusRows, expectedAnalysis.playerPlusMinusRows, "サマリー個人別+/-が期待値と一致する");
assert.equal(summary.gameScore, expected.summary.finalGameScore, "サマリーのゲームスコアが期待値と一致する");
assert.equal(summary.playerServeReceiveStats.length, 4, "個人別S/Rは全選手分を保持する");
assert.equal(summary.flowRows.find(([label]) => label === "1ポイント目取得率")[1], expected.flow.ownOpeningPointRate, "1ポイント目取得率が期待値と一致する");

const shareLayout = vm.runInContext("drawSummaryImage(document.createElement('canvas'), getSummaryImageData(), 'share')", context);
const detailLayout = vm.runInContext("drawSummaryImage(document.createElement('canvas'), getSummaryImageData(), 'detail')", context);
assert.equal(shareLayout.pageCount, 1, "fixtureでもチーム共有用サマリーは1枚画像で生成する");
assert.equal(detailLayout.pageCount, 6, "fixtureでも振り返り用サマリーは6ページ相当で生成する");
assert.ok(detailLayout.contentBottom < detailLayout.footerTop, "fixtureの振り返り用サマリー本文がフッターに重ならない");
const corpusExpected = JSON.parse(fs.readFileSync(path.join("tests", "fixtures", "practice-match-corpus-expected.json"), "utf8"));
corpusExpected.fixtures.forEach((fixture) => {
  const corpusRows = parseCsv(fs.readFileSync(path.join("tests", "fixtures", fixture.file), "utf8"));
  context.__corpusPoints = rowsToFixturePoints(corpusRows);
  context.__corpusFixture = fixture;
  vm.runInContext(`
    state = structuredClone(defaultState);
    state.matchType = __corpusFixture.match.type === "シングルス" ? "singles" : "doubles";
    state.matchFormat = "7";
    state.gamesToWin = 4;
    state.teams = { A: "自チーム", B: "相手ペア" };
    state.players = { ARear: "自後衛A", AFront: "自前衛A", BRear: "相手後衛B", BFront: "相手前衛B" };
    state.matchInfo = {
      ...state.matchInfo,
      date: __corpusFixture.match.date,
      event: __corpusFixture.match.event,
      tournament: "検証練習試合",
      venueName: "検証会場"
    };
    state.points = __corpusPoints;
    state.games = { A: __corpusFixture.summary.ownGamesWon, B: __corpusFixture.summary.opponentGamesWon };
    state.gamePoints = { A: 0, B: 0 };
    state.finished = __corpusFixture.summary.ownGamesWon >= 4 || __corpusFixture.summary.opponentGamesWon >= 4;
  `, context);
  const corpusData = JSON.parse(JSON.stringify(vm.runInContext("getAnalysisData()", context)));
  const corpusSummary = JSON.parse(JSON.stringify(vm.runInContext("getSummaryImageData()", context)));
  assert.equal(corpusData.total, fixture.rowCount, `${fixture.name} の分析対象ポイント数が一致する`);
  assert.equal(corpusData.ownPoints, fixture.summary.ownPoints, `${fixture.name} の自チーム得点数が一致する`);
  assert.equal(corpusData.ownLost, fixture.summary.opponentPoints, `${fixture.name} の相手得点数が一致する`);
  assert.equal(corpusData.pointDiff, fixture.summary.ownPoints - fixture.summary.opponentPoints, `${fixture.name} のポイント差が一致する`);
  assert.equal(corpusSummary.gameScore, fixture.summary.gameScore, `${fixture.name} のサマリーゲームスコアが一致する`);
  assert.equal(corpusSummary.flowRows.find(([label]) => label === "最長連続得点")[1], fixture.flow.longestOwnStreak?.count || 0, `${fixture.name} の最長連続得点が一致する`);
  assert.equal(corpusSummary.flowRows.find(([label]) => label === "最長連続失点")[1], fixture.flow.longestOpponentStreak?.count || 0, `${fixture.name} の最長連続失点が一致する`);
  const expectedPlayerRows = fixture.match.type === "シングルス" ? 2 : 4;
  assert.equal(corpusSummary.playerPlusMinusRows.length, expectedPlayerRows, `${fixture.name} の個人別+/-は全選手分を表示する`);
  Object.keys(fixture.players).forEach((name) => {
    assert.ok(corpusSummary.playerPlusMinusRows.some(([label]) => label === name), `${fixture.name} の個人別+/-に${name}を含む`);
  });
});

console.log("fixture-analysis-regression: ok");
