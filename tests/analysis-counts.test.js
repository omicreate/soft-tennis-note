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
    classList: { toggled: {}, toggle(name, force) { this.toggled[name] = force; } },
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
    },
    querySelectorAll() {
      return [];
    }
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
    fillRect(x, y, width, height) {
      calls.push({ type: "fillRect", x, y, width, height });
    },
    fillText(text, x, y) {
      calls.push({ type: "fillText", text: String(text), x, y, font: this.font });
    },
    measureText(text) {
      const size = Number(this.font.match(/(\\d+)px/)?.[1] || 28);
      return { width: String(text).length * size * 0.58 };
    },
    beginPath() {},
    moveTo() {},
    lineTo() {},
    arcTo() {},
    closePath() {},
    fill() {
      calls.push({ type: "fill", fillStyle: this.fillStyle });
    },
    stroke() {}
  };
  return {
    width: 0,
    height: 0,
    getContext: () => context2d,
    toDataURL: () => "data:image/png;base64,TEST"
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
    createElement: (selector) => selector === "canvas" ? createCanvasElement() : createElement(selector)
  },
  localStorage: {
    getItem: () => null,
    setItem() {}
  },
  location: { protocol: "file:" },
  navigator: {}
};

const source = `${fs.readFileSync("app-config.js", "utf8")}\n${fs.readFileSync("app-analysis.js", "utf8")}\n${fs.readFileSync("app-storage.js", "utf8")}\n${fs.readFileSync("app-rules.js", "utf8")}\n${fs.readFileSync("app.js", "utf8")}`;
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
      serverPlayer: "不明",
      receiverPlayer: "不明",
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
  assert.match(elements.scoringSituationBars.innerHTML, /相手ミスで得点/, "相手ミスは得点しやすい場面に含める");
  assert.match(elements.errorBars.innerHTML, /まだ記録がありません/, "相手ミスを自チーム失点バーに表示しない");
  assert.match(elements.opponentView.innerHTML, /試合から分かったこと/, "試合から分かったことを表示する");
  assert.match(elements.opponentView.innerHTML, /自チーム/, "試合から分かったことに自チーム側を表示する");
  assert.match(elements.opponentView.innerHTML, /相手/, "試合から分かったことに相手側を表示する");
  assert.doesNotMatch(elements.opponentView.innerHTML, /短く見るポイント/, "短く見るポイントは表示しない");
  assert.doesNotMatch(buildPriorityItems().join("\\n"), /。$/, "次の練習テーマの文末には句点を付けない");

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
  assert.doesNotMatch(elements.analysisSummary.innerHTML, /ポイント差/, "分析サマリーではポイント差を主役にしない");
  assert.doesNotMatch(elements.analysisSummary.innerHTML, /取得ポイント/, "分析サマリーから取得ポイントを外す");
  assert.match(elements.analysisSummary.innerHTML, /ゲーム最初の1本/, "分析サマリーにゲーム最初の1本を表示する");
  assert.match(elements.analysisSummary.innerHTML, /ミスで落とした/, "分析サマリーに自チームミス失点を表示する");

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
  assert.match(elements.playerBars.innerHTML, /pm-total-badge/, "個人別+/-の合計値を強調表示する");
  assert.match(elements.playerBars.innerHTML, /ストローク得点/, "プレイヤー別に記録した得点内容を表示する");
  assert.match(elements.playerBars.innerHTML, /ボレーミス/, "プレイヤー別に記録したミス内容を表示する");
  const involvementItems = getPlayerInvolvementItems();
  assert.equal(involvementItems.length, 4, "個人別分析に全選手の関与を表示する");
  assert.match(involvementItems.find((item) => item.label === "自後衛").comment, /関与 1本/, "個人別分析に関与本数を表示する");
  assert.match(involvementItems.find((item) => item.label === "自前衛").comment, /記録なし/, "未記録選手は判断しないコメントにする");

  setPoints([
    point({ winner: "A", outcome: "ストローク得点", player: "A後衛" }),
    point({ winner: "A", outcome: "ボレー得点", player: "A後衛" }),
    point({ winner: "A", outcome: "スマッシュ得点", player: "A後衛" }),
    point({ winner: "B", outcome: "ストロークミス", player: "A後衛" }),
    point({ winner: "B", outcome: "ボレーミス", player: "A後衛" })
  ]);
  renderPlayerPlusMinus();
  assert.match(elements.playerBars.innerHTML, /ボレーミス/, "5件目のプレー内容もほかに隠さず表示する");
  assert.doesNotMatch(elements.playerBars.innerHTML, /ほか/, "5件以内ならほか表示にまとめない");

  setPoints([
    point({ winner: "B", outcome: "ストロークミス", player: "A後衛", scoreBefore: score({ A: 0, B: 0 }) }),
    point({ winner: "A", outcome: "ストローク得点", player: "A後衛", scoreBefore: score({ A: 0, B: 1 }) })
  ]);
  data = getAnalysisData();
  assert.equal(data.openingPointOwn, 0, "分析コメント用にゲーム1ポイント目取得数を渡す");
  assert.equal(data.longestOppStreak, 1, "分析コメント用に連続失点を渡す");
  assert.equal(ANALYSIS_COMMENT_RULES.attackRateHigh, 60, "分析コメントの攻撃型しきい値を設定で管理する");
  assert.equal(ANALYSIS_COMMENT_RULES.summaryLimit, 5, "分析コメントの表示件数を設定で管理する");
  assert.equal(ANALYSIS_COMMENT_MESSAGES.quickDoubleFault.includes("ダブルフォールト"), true, "分析コメント文言を設定で管理する");
  assert.equal(ANALYSIS_COMMENT_MESSAGES.summaryOpeningLow.includes("1ポイント目"), true, "詳細数字に連動する分析コメント文言を設定で管理する");
  assert.equal(typeof SOFT_TENNIS_ANALYSIS.buildSummaryCommentsFromData, "function", "分析コメント生成を分離ファイルで管理する");
  assert.equal(typeof SOFT_TENNIS_RULES.applyPointToScore, "function", "スコア進行を分離ファイルで管理する");
  assert.equal(SOFT_TENNIS_RULES.pointLabel({ matchFormat: "7", gamesToWin: 4, games: { A: 0, B: 0 }, gamePoints: { A: 4, B: 4 } }, "A"), "4 D", "デュース表示をルールファイルで判定する");
  state.players.ARear = "佐藤";
  state.players.AFront = "鈴木";
  state.players.BRear = "高橋";
  state.players.BFront = "田中";
  setPoints([
    point({ winner: "B", outcome: "ストロークミス", scoreBefore: score({ A: 0, B: 0 }) }),
    point({ winner: "B", outcome: "レシーブミス", scoreBefore: score({ A: 0, B: 0 }, { A: 0, B: 0 }) }),
    point({ winner: "B", outcome: "ストロークミス", scoreBefore: score({ A: 1, B: 2 }) }),
    point({ winner: "B", outcome: "ストロークミス", scoreBefore: score({ A: 2, B: 2 }) }),
    point({ winner: "B", outcome: "ストロークミス", scoreBefore: score({ A: 3, B: 2 }) })
  ]);
  data = getAnalysisData();
  const linkedComments = buildSummaryComments(data).join("\\n");
  assert.match(linkedComments, /1ポイント目/, "試合から分かったことにゲーム1ポイント目の根拠を出す");
  assert.match(linkedComments, /最長連続失点/, "試合から分かったことに連続失点の根拠を出す");
  assert.match(linkedComments, /ゲームポイント逸失/, "試合から分かったことに勝負所の根拠を出す");
  assert.match(buildQuickCoachItems(data).join("\\n"), /連続失点/, "次の練習テーマにも詳細数字からの注意を出す");

  setPoints([
    point({ winner: "B", outcome: "ストロークミス", player: "A後衛", scoreBefore: score({ A: 0, B: 0 }) }),
    point({ winner: "A", outcome: "ストローク得点", player: "A後衛", scoreBefore: score({ A: 0, B: 1 }) })
  ]);
  state.players.ARear = "佐藤";
  state.players.AFront = "鈴木";
  state.players.BRear = "高橋";
  state.players.BFront = "田中";

  const summaryImage = getSummaryImageData();
  assert.match(summaryImage.title, /ソフトテニス試合ノート/, "画像サマリー用のタイトルを作る");
  assert.equal(summaryImage.summaryRows.some(([label]) => label === "ミスで落とした"), true, "画像サマリーに重要指標を含める");
  assert.equal(summaryImage.detailRows.some(([label]) => label === "ラリーの長さ"), true, "画像サマリーにラリーの長さを含める");
  assert.equal(Array.isArray(summaryImage.priorityItems), true, "画像サマリーにあとで確認することを含める");
  assert.equal(summaryImage.conditionRows.some(([label]) => label === "日時"), true, "画像サマリーに試合条件を含める");
  assert.deepEqual(summaryImage.playerRows.map(([label]) => label), ["自チーム後衛", "自チーム前衛", "相手後衛", "相手前衛"], "画像サマリーに全プレイヤー名を含める");
  assert.equal(summaryImage.gameScore, "0-0", "画像サマリーに全体ゲームスコアを含める");
  assert.equal(summaryImage.gameScoreRows[0][1], "1-1", "画像サマリーに各ゲームのポイントスコアを含める");
  assert.equal(summaryImage.playerPlusMinusRows.length, 4, "詳細サマリーに個人別+/-を全員分含める");
  assert.equal(summaryImage.playerPlayRows.length, 4, "詳細サマリーにプレイヤー別プレー内容を全員分含める");
  assert.equal(summaryImage.playerPlayRows.some(([, value]) => String(value).includes("ストローク得点")), true, "詳細サマリーにプレイヤー別プレー内容を含める");
  assert.equal(summaryImage.playerInvolvementRows.length, 4, "サマリーに選手別の関わりを全員分含める");
  assert.equal(summaryImage.playerInvolvementRows.some(([, value]) => String(value).includes("関与")), true, "サマリーの選手別関わりに関与本数を含める");
  assert.equal(summaryImage.playerServeReceiveStats.length, 4, "サマリーに個人別S/Rを全員分含める");
  assert.equal(summaryImage.playerServeReceiveStats.every((item) => Number.isInteger(item.serveScores) && Number.isInteger(item.receiveScores)), true, "サマリー個人別S/Rにサーブ得点・レシーブ得点を含める");
  assert.equal(summaryImage.pointBreakdownRows.length >= 3, true, "サマリーに得点と失点の図解用データを含める");
  assert.equal(summaryImage.actionPlanRows.length >= 1, true, "振り返り用サマリーに次へつなげる練習テーマを含める");
  assert.equal(summaryImage.detailRows.some(([label]) => label === "1ポイント目取得率"), true, "詳細サマリーに1ポイント目取得率を含める");
  assert.equal(getRallyLengthStats([point({ rally: "3" }), point({ rally: "4" }), point({ rally: "10+" })]).short, 1, "3本以内のラリーを集計する");
  assert.equal(getRallyLengthStats([point({ rally: "3" }), point({ rally: "4" }), point({ rally: "10+" })]).long, 2, "4本以上のラリーを集計する");
  state.selectedServe = "ダブルフォールト";
  state.selectedOutcome = "ダブルフォールト";
  state.selectedRallyLength = "short";
  assert.equal(getRallyValueForSave(), "3", "DFは3本以内として保存する");
  state.selectedServe = "第1サービスで開始";
  state.selectedOutcome = "ストローク得点";
  syncRallyLengthFromOutcome(state.selectedOutcome);
  assert.equal(getRallyValueForSave(), "4", "ストロークは4本以上として保存する");
  state.selectedOutcome = "レシーブミス";
  syncRallyLengthFromOutcome(state.selectedOutcome);
  assert.equal(getRallyValueForSave(), "3", "レシーブで終わるポイントは3本以内として保存する");
  state.finished = true;
  state.games = { A: 4, B: 2 };
  const finishedSummaryImage = getSummaryImageData();
  assert.deepEqual(finishedSummaryImage.resultRows[0], ["試合結果", "自チームの勝ち"], "画像サマリーに勝った側を表示する");
  assert.deepEqual(finishedSummaryImage.resultRows[1], ["ゲームスコア", "4-2"], "画像サマリーに最終ゲームスコアを表示する");
  assert.equal(
    getSummaryImageFileName(new Date("2026-05-27T13:45:06"), "share").startsWith("soft-tennis-summary-share-20260527134506-"),
    true,
    "画像ファイル名に用途と年月日時分秒を含める"
  );
  assert.match(getSummaryImageFileName(new Date("2026-05-27T13:45:06"), "detail"), /soft-tennis-summary-detail-20260527134506-/, "振り返り用のファイル名を作る");
  const shareCanvas = document.createElement("canvas");
  const shareLayout = drawSummaryImage(shareCanvas, summaryImage, "share");
  const fullNameCanvas = document.createElement("canvas");
  drawSummaryImage(fullNameCanvas, summaryImage, "share", "full");
  const detailLayout = drawSummaryImage(document.createElement("canvas"), summaryImage, "detail");
  const summaryImageTexts = shareCanvas.getContext("2d").calls.filter((call) => call.type === "fillText").map((call) => call.text);
  const fullNameTexts = fullNameCanvas.getContext("2d").calls.filter((call) => call.type === "fillText").map((call) => call.text);
  assert.equal(summaryImageTexts.some((text) => /^(#|>|- )/.test(text)), false, "一般ユーザ向け画像にMarkdown記号を表示しない");
  assert.equal(summaryImageTexts.some((text) => String(text).includes("undefined")), false, "画像サマリーにundefinedを表示しない");
  assert.ok(shareLayout.contentBottom < shareLayout.footerTop, "チーム共有用サマリー画像の本文がフッターに重ならない");
  assert.ok(detailLayout.contentBottom < detailLayout.footerTop, "振り返り用サマリー画像の本文がフッターに重ならない");
  assert.equal(shareLayout.height < detailLayout.height, true, "チーム共有用は振り返り用より短い画像にする");
  assert.deepEqual(
    shareLayout.sections.slice(0, 6),
    ["チーム共有サマリー", "試合結果", "試合から分かったこと", "次の練習テーマ", "主な数字", "選手別 + / -"],
    "チーム共有用サマリーは結果、試合から分かったこと、次の練習テーマ、主な数字の順に表示する"
  );
  assert.equal(summaryImageTexts.some((text) => /TEAM SHARE/.test(String(text))), true, "チーム共有用サマリーはチーム共有向けの見出しを表示する");
  assert.equal(summaryImageTexts.some((text) => String(text).includes("佐藤")), false, "役割のみでは選手名を表示しない");
  assert.equal(summaryImageTexts.some((text) => String(text).includes("自チーム後衛")), true, "役割のみでは役割名を表示する");
  assert.equal(fullNameTexts.some((text) => String(text).includes("佐藤")), true, "名前ありでは選手名を表示する");
  assert.deepEqual(
    detailLayout.sections.slice(0, 8),
    ["試合結果", "試合から分かったこと", "次の練習テーマ", "優先して練習すること", "選手別の関わり", "選手別 サーブ/レシーブ", "流れと勝負所", "得点と失点の内訳"],
    "振り返り用サマリーは試合から分かったこと、練習テーマ、選手別の関わり、サーブ/レシーブの順に表示する"
  );
  assert.equal(shareLayout.pageCount, 1, "チーム共有用サマリーは1枚画像にする");
  assert.equal(detailLayout.pageCount, 6, "振り返り用サマリーは練習テーマを含む複数ページにする");
  assert.equal(detailLayout.footerTop - detailLayout.contentBottom > 24, true, "振り返り用サマリーは枠と文字が重ならない余白を残す");
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

  setPoints([
    point({ winner: "A", rally: "3", scoreBefore: score({ A: 0, B: 0 }) }),
    point({ winner: "A", rally: "4", scoreBefore: score({ A: 1, B: 0 }) }),
    point({ winner: "B", rally: "4", outcome: "ストロークミス", scoreBefore: score({ A: 2, B: 0 }) }),
    point({ winner: "B", rally: "3", scoreBefore: score({ A: 3, B: 2 }) }),
    point({ winner: "B", rally: "4", scoreBefore: { games: { A: 3, B: 2 }, points: { A: 3, B: 2 } } })
  ]);
  const opening = getGameOpeningStats();
  assert.equal(opening.rate, 100, "ゲームの1ポイント目取得率を集計する");
  const streaks = getStreakDetails();
  assert.equal(streaks.own.count, 2, "最長連続得点を集計する");
  assert.equal(streaks.opp.count, 3, "最長連続失点を集計する");
  const clutch = getClutchStats();
  assert.equal(clutch.ownGamePointMissed >= 2, true, "ゲームポイント逸失を集計する");
  assert.equal(clutch.ownMatchPointMissed >= 1, true, "マッチポイント逸失を集計する");
  renderMomentumRows(elements.momentumBars, getMomentumRows());
  assert.match(elements.momentumBars.innerHTML, /1ポイント目取得/, "流れと勝負どころを表示する");
  assert.match(elements.momentumBars.innerHTML, /momentum-card/, "流れと勝負どころは読みやすいカードで表示する");
  assert.match(elements.momentumBars.innerHTML, /1G 0-0|3G 3-2/, "流れと勝負どころにゲームとカウントを表示する");
  renderStats();
  assert.match(elements.rallyLengthBars.innerHTML, /3本以内|4本以上/, "分析画面にラリーの長さを表示する");
  assert.match(buildSummaryComments(getAnalysisData()).join("\\n"), /4本以上/, "分析コメントにラリーの傾向を反映する");
  assert.match(buildPriorityItems().join("\\n"), /4本以上/, "次の練習テーマにラリー傾向を反映する");
  renderServeReceiveCards();
  assert.match(elements.serveReceiveBars.innerHTML, /第1サービス/, "サーブ\/レシーブ傾向を表示する");
  setPoints([
    point({ winner: "A", server: "A", serveStart: "第1サービスで開始", outcome: "サービス得点", serverPlayer: "A後衛", receiverPlayer: "B後衛" }),
    point({ winner: "B", server: "A", serveStart: "第2サービスで開始", outcome: "ダブルフォールト", serverPlayer: "A後衛", receiverPlayer: "B前衛" }),
    point({ winner: "A", server: "B", outcome: "レシーブ得点", serverPlayer: "B後衛", receiverPlayer: "A前衛" }),
    point({ winner: "B", server: "B", outcome: "レシーブミス", serverPlayer: "B前衛", receiverPlayer: "A前衛" }),
    point({ winner: "B", server: "A", outcome: "ストロークミス", serverPlayer: "A前衛", receiverPlayer: "B後衛" })
  ]);
  const srRows = getPlayerServeReceiveRows();
  assert.equal(srRows.find(([label]) => label === "自後衛")[1].includes("第1サービス 1/2本 (50%)・DF 1本"), true, "サーブ選手別に1st本数とDFを表示する");
  assert.equal(srRows.find(([label]) => label === "自前衛")[1].includes("レシーブ成功 1/2本 (50%)・レシーブ得点 1本・レシーブミス 1本"), true, "レシーブ選手別に成功本数、得点、ミスを表示する");
  renderServeReceiveCards();
  assert.match(elements.serveReceiveBars.innerHTML, /自前衛/, "個人別サーブ/レシーブ傾向をカード表示する");
  assert.match(elements.serveReceiveBars.innerHTML, /sr-card own/, "自チームのS/Rカードを表示する");

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

  setPoints([point({ winner: "A", outcome: "ストローク得点", player: "不明" })]);
  renderHistory();
  assert.match(elements.pointList.innerHTML, /詳細を補足/, "履歴からポイント詳細を後で補足できる");
  openPointDetailEditor(0);
  document.querySelector("#pointEditPlayerSelect").value = "A後衛";
  document.querySelector("#pointEditOutcomeSelect").value = "ボレー得点";
  document.querySelector("#pointEditShotSelect").value = "ボレー";
  document.querySelector("#pointEditRallySelect").value = "4";
  document.querySelector("#pointEditHandSelect").value = "フォアハンド";
  document.querySelector("#pointEditCourseSelect").value = "中央前";
  document.querySelector("#pointEditResultSelect").value = "イン";
  document.querySelector("#pointEditMemoInput").value = "試合後に補足";
  savePointDetailEdit();
  assert.equal(state.points[0].player, "A後衛", "補足で誰のプレーを更新する");
  assert.equal(state.points[0].outcome, "ボレー得点", "補足でポイント内容を更新する");
  assert.equal(state.points[0].memo, "試合後に補足", "補足でメモを更新する");

  setPoints([]);
  const recordStart = document.querySelector("#recordStart");
  addPoint("A");
  state = structuredClone(defaultState);
  renderScore();
  assert.equal(document.body.classList.toggled?.["simple-record-mode"], true, "初期表示はかんたん記録モード");
  state.recordMode = "detail";
  renderScore();
  assert.equal(document.body.classList.toggled?.["detail-record-mode"], false, "詳細記録モードは試合中の主導線にしない");

  assert.equal(recordStart.scrolled, true, "記録後は次の入力欄へスクロールする");
  assert.equal(recordStart.focused, true, "記録後は次の入力欄へフォーカスする");

  saveAnalysisMemo();
  assert.equal(state.analysisMemos.length, 1, "振り返りを保存する");
  assert.match(elements.analysisMemoList.innerHTML, /点時点/, "保存した分析を表示する");
  assert.match(elements.analysisMemoList.innerHTML, /次の練習テーマ/, "保存した分析に次の練習テーマを含める");
`;

context.assert = assert;
vm.createContext(context);
vm.runInContext(`${source}\n${testCode}`, context, { filename: "app.js+analysis-counts.test.js" });
console.log("analysis-counts: ok");
