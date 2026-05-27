const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function createElement(selector = "") {
  return {
    selector,
    dataset: selector === ".tab.active" ? { tab: "record" } : {},
    value: "",
    textContent: "",
    innerHTML: "",
    hidden: false,
    title: "",
    style: {},
    classList: { toggle() {} },
    addEventListener() {},
    focus() {
      this.focused = true;
    },
    scrollIntoView() {
      this.scrolled = true;
    },
    showModal() {},
    close() {},
    click() {},
    closest() {
      return null;
    }
  };
}

const elements = new Map();
function element(selector) {
  if (!elements.has(selector)) elements.set(selector, createElement(selector));
  return elements.get(selector);
}

const context = {
  console,
  Blob: function Blob() {},
  URL: {
    createObjectURL: () => "blob:test",
    revokeObjectURL() {}
  },
  crypto: {
    randomUUID: () => "test-id"
  },
  structuredClone,
  requestAnimationFrame: (callback) => callback(),
  window: {
    matchMedia: () => ({ matches: true })
  },
  document: {
    body: createElement("body"),
    querySelector: element,
    querySelectorAll: () => [],
    createElement
  },
  localStorage: {
    getItem: () => null,
    setItem() {}
  },
  location: { protocol: "file:" },
  navigator: {}
};

const source = fs.readFileSync("app.js", "utf8");
const testCode = `
  const assert = globalThis.assert;

  function point(overrides) {
    return {
      winner: "A",
      server: "A",
      outcome: "ストローク得点",
      serveStart: "第1サービスで開始",
      result: "イン",
      phase: "ゲーム序盤",
      hand: "不明",
      player: "不明",
      course: "中央奥",
      scoreBefore: { games: { A: 0, B: 0 }, points: { A: 0, B: 0 } },
      scoreAfter: { games: { A: 0, B: 0 }, points: { A: 1, B: 0 } },
      ...overrides
    };
  }

  function score(points, games = { A: 0, B: 0 }) {
    return { games, points };
  }

  function setPoints(points) {
    state = structuredClone(defaultState);
    state.points = points;
  }

  setPoints([
    point({ winner: "A", server: "A", outcome: "レシーブミス" })
  ]);
  let data = getAnalysisData();
  assert.equal(data.ownPoints, 1, "相手のレシーブミスは自チーム得点");
  assert.equal(data.ownLost, 0, "相手のミスを自チーム失点にしない");
  assert.deepEqual(data.topError, ["なし", 0], "失点内訳に相手のミスを混ぜない");
  assert.deepEqual(countByOutcomeType("error", state.points.filter((p) => p.winner === "B")), {}, "失点グラフに相手ミスを混ぜない");
  renderStats();
  assert.match(elements.opponentErrorBars.innerHTML, /レシーブミス/, "相手ミスパターンには相手のミスを表示する");
  assert.match(elements.errorBars.innerHTML, /まだ記録がありません/, "相手ミスを自チーム失点バーに表示しない");
  assert.match(elements.opponentView.innerHTML, /あとで確認すること/, "あとで確認することを表示する");
  assert.match(elements.opponentView.innerHTML, /レシーブミス/, "次に狙いたい相手ミスを表示する");
  assert.doesNotMatch(buildPriorityItems().join("\\n"), /。$/, "あとで確認することの文末には句点を付けない");

  setPoints([
    point({ winner: "B", server: "B", outcome: "レシーブミス" })
  ]);
  data = getAnalysisData();
  assert.equal(data.ownPoints, 0, "自チームのレシーブミスは相手得点");
  assert.equal(data.ownLost, 1, "自チームのレシーブミスは自チーム失点");
  assert.equal(data.ownReceiveMisses, 1, "相手サービス時のレシーブミスだけを自チームレシーブミスに数える");
  assert.deepEqual(data.topError, ["レシーブミス", 1], "失点内訳に自チームミスを数える");

  setPoints([
    point({ winner: "B", outcome: "スマッシュ得点" }),
    point({ winner: "B", outcome: "スマッシュ得点" }),
    point({ winner: "A", outcome: "ボレー得点" })
  ]);
  data = getAnalysisData();
  assert.equal(data.ownScoredByPattern, 1, "自チーム得点パターンだけを数える");
  assert.deepEqual(data.topScore, ["ボレー得点", 1], "相手の得点パターンを自チーム最多得点にしない");

  setPoints([
    point({ winner: "B", server: "A", outcome: "ダブルフォールト" }),
    point({ winner: "A", server: "B", outcome: "ダブルフォールト" })
  ]);
  data = getAnalysisData();
  assert.equal(data.ownDoubleFaults, 1, "自チームサーブ時のDFだけを自チームDFに数える");
  assert.equal(data.ownPointsByOpponentError, 1, "相手DFは自チーム得点の相手ミスとして数える");
  assert.equal(data.ownLostByOwnError, 1, "自チームDFは自チームミス失点として数える");
  assert.deepEqual(data.topError, ["ダブルフォールト", 1], "自チームDFは失点内訳に数える");

  renderAnalysisSummary();
  assert.doesNotMatch(elements.analysisSummary.innerHTML, /取れた割合/, "分析サマリーから取れた割合を外す");
  assert.match(elements.analysisSummary.innerHTML, /ミス失点/, "分析サマリーに自チームミス失点を表示する");

  setPoints([
    point({ winner: "A", outcome: "ストローク得点", player: "A後衛" }),
    point({ winner: "B", outcome: "ボレーミス", player: "B前衛" })
  ]);
  renderPlayerPlusMinus();
  assert.match(elements.playerBars.innerHTML, /自後衛/, "個人別に自チーム後衛を表示する");
  assert.match(elements.playerBars.innerHTML, /自前衛/, "個人別に自チーム前衛を0件でも表示する");
  assert.match(elements.playerBars.innerHTML, /相手後衛/, "個人別に相手後衛を0件でも表示する");
  assert.match(elements.playerBars.innerHTML, /相手前衛/, "個人別に相手前衛を表示する");
  assert.match(elements.playerBars.innerHTML, /\\+0/, "未記録選手は0で表示する");

  setPoints([
    point({ winner: "B", scoreBefore: score({ A: 0, B: 0 }) }),
    point({ winner: "A", scoreBefore: score({ A: 0, B: 1 }) })
  ]);
  const summaryImage = getSummaryImageData();
  assert.match(summaryImage.title, /ソフトテニス試合ノート/, "画像サマリー用のタイトルを作る");
  assert.equal(summaryImage.summaryRows.some(([label]) => label === "ミス失点"), true, "画像サマリーに重要指標を含める");
  assert.equal(Array.isArray(summaryImage.priorityItems), true, "画像サマリーにあとで確認することを含める");
  assert.equal(summaryImage.conditionRows.some(([label]) => label === "日時"), true, "画像サマリーに試合条件を含める");
  assert.deepEqual(summaryImage.playerRows.map(([label]) => label), ["自チーム後衛", "自チーム前衛", "相手後衛", "相手前衛"], "画像サマリーに全プレイヤー名を含める");
  assert.equal(summaryImage.gameScore, "0-0", "画像サマリーに全体ゲームスコアを含める");
  assert.equal(summaryImage.gameScoreRows[0][1], "1-1", "画像サマリーに各ゲームのポイントスコアを含める");
  state.finished = true;
  state.games = { A: 4, B: 2 };
  const finishedSummaryImage = getSummaryImageData();
  assert.deepEqual(finishedSummaryImage.resultRows[0], ["試合結果", "自チームの勝ち"], "画像サマリーに勝った側を表示する");
  assert.deepEqual(finishedSummaryImage.resultRows[1], ["ゲームスコア", "4-2"], "画像サマリーに最終ゲームスコアを表示する");
  saveAnalysisMemo();
  const summaryImageWithMemo = getSummaryImageData();
  assert.match(summaryImageWithMemo.analysisMemoTitle, /保存した分析/, "画像サマリーに保存した分析の見出しを含める");
  assert.equal(Array.isArray(summaryImageWithMemo.analysisMemoItems), true, "画像サマリーに保存した分析の内容を含める");

  setPoints([
    point({ winner: "A", outcome: "ストロークミス", phase: "ゲーム序盤" }),
    point({ winner: "B", outcome: "ストロークミス", scoreBefore: score({ A: 0, B: 1 }) }),
    point({ winner: "B", outcome: "ボレー得点", scoreBefore: score({ A: 2, B: 3 }) }),
    point({ winner: "B", outcome: "スマッシュ得点", scoreBefore: score({ A: 3, B: 3 }) }),
    point({ winner: "B", outcome: "レシーブミス", scoreBefore: score({ A: 1, B: 2 }) })
  ]);
  const phases = getPhaseCounts();
  assert.equal(phases["最初の2本で失点"], 1, "相手ミスによる自チーム得点を最初の2本の失点にしない");
  assert.equal(phases["ゲームポイント付近で失点"], 1, "ゲームポイント付近の失点を数える");
  assert.equal(phases["デュース以降で失点"], 1, "デュース以降の失点を数える");
  assert.equal(phases["サービス/レシーブ失点"], 1, "サービス/レシーブ失点を別枠でも数える");

  const zeroBars = document.querySelector("#zeroBars");
  renderBars(zeroBars, { "最初の2本で失点": 0, "ゲームポイント付近で失点": 0 });
  assert.match(zeroBars.innerHTML, /まだ記録がありません/, "0件のバーは表示しない");
  assert.doesNotMatch(zeroBars.innerHTML, /bar-fill/, "0件で棒だけ進んだ表示にしない");
  assert.deepEqual(countBy("course", [point({ course: "未記録" }), point({ course: "中央奥" })]), { "中央奥": 1 }, "未記録の到達位置は集計しない");

  renderHistory();
  assert.match(elements.historyDateLabel.textContent, /2026-05-26|日付未記録/, "履歴に日付を表示する");
  assert.match(elements.pointList.innerHTML, /history-game/, "履歴をゲームごとに表示する");
  assert.match(elements.pointList.innerHTML, /1G/, "履歴にゲーム見出しを表示する");
  assert.match(elements.pointList.innerHTML, /history-item own/, "自チーム得点履歴にはownクラス");
  assert.match(elements.pointList.innerHTML, /history-item opp/, "相手得点履歴にはoppクラス");
  assert.match(elements.pointList.innerHTML, /相手/, "履歴に誰のプレーかを表示する");
  assert.match(elements.pointList.innerHTML, /第1サービスで開始/, "履歴にサービス情報を表示する");
  assert.ok(elements.pointList.innerHTML.indexOf("4点目") < elements.pointList.innerHTML.indexOf("1点目"), "履歴は初期状態で新しい順");
  elements.historySortSelect.value = "oldest";
  renderHistory();
  assert.ok(elements.pointList.innerHTML.indexOf("1点目") < elements.pointList.innerHTML.indexOf("4点目"), "履歴は古い順に切り替え可能");
  elements.historySortSelect.value = "newest";
  elements.historyFilterSelect.value = "own";
  renderHistory();
  assert.match(elements.pointList.innerHTML, /history-item own/, "履歴フィルターで自チーム得点を表示");
  assert.doesNotMatch(elements.pointList.innerHTML, /history-item opp/, "履歴フィルターで相手得点を非表示");
  elements.historyFilterSelect.value = "opp";
  renderHistory();
  assert.match(elements.pointList.innerHTML, /history-item opp/, "履歴フィルターで相手得点を表示");
  elements.historyFilterSelect.value = "errors";
  renderHistory();
  assert.match(elements.pointList.innerHTML, /ストロークミス/, "履歴フィルターでミスだけを表示");
  elements.historyFilterSelect.value = "late";
  renderHistory();
  assert.match(elements.pointList.innerHTML, /ゲーム終盤|ゲームポイント付近|デュース以降|履歴はまだありません/, "履歴フィルターで終盤を対象にする");
  elements.historyFilterSelect.value = "all";

  setPoints([]);
  const recordStart = document.querySelector("#recordStart");
  addPoint("A");
  assert.equal(recordStart.scrolled, true, "記録後は次の入力欄へスクロールする");
  assert.equal(recordStart.focused, true, "記録後は次の入力欄へフォーカスする");

  saveAnalysisMemo();
  assert.equal(state.analysisMemos.length, 1, "分析を保存する");
  assert.match(elements.analysisMemoList.innerHTML, /点時点/, "保存した分析を表示する");
  assert.match(elements.analysisMemoList.innerHTML, /今すぐ意識すること/, "保存した分析に即時アドバイスを含める");
  assert.match(elements.analysisMemoList.innerHTML, /あとで確認すること/, "保存した分析に確認ポイントを含める");
`;

context.assert = assert;
vm.createContext(context);
vm.runInContext(`${source}\n${testCode}`, context, { filename: "app.js+analysis-counts.test.js" });
console.log("analysis-counts: ok");
