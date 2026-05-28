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
    scrolled: false,
    focused: false,
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

function createAppContext(savedStateText = null) {
  const elements = new Map();
  const savedWrites = [];
  const savedStorage = new Map();
  const createdAnchors = [];

  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, createElement(selector));
    return elements.get(selector);
  }

  const context = {
    console,
    Blob: function Blob() {},
    File: function File(parts, name, options) {
      this.parts = parts;
      this.name = name;
      this.type = options?.type || "";
    },
    atob: (value) => Buffer.from(value, "base64").toString("binary"),
    URL: {
      createObjectURL: () => "blob:test",
      revokeObjectURL() {}
    },
    Date,
    crypto: {
      randomUUID: () => `test-${savedWrites.length}-${Math.random()}`
    },
    structuredClone,
    requestAnimationFrame: (callback) => callback(),
    window: {
      matchMedia: () => ({ matches: true }),
      confirm: () => true
    },
    document: {
      body: createElement("body"),
      querySelector: element,
      querySelectorAll: () => [],
      createElement: (selector) => {
        const created = createElement(selector);
        if (selector === "a") {
          created.click = () => {
            created.clicked = true;
          };
          createdAnchors.push(created);
        }
        return created;
      }
    },
    localStorage: {
      getItem: (key) => savedStorage.has(key) ? savedStorage.get(key) : savedStateText,
      setItem: (key, value) => {
        savedStorage.set(key, value);
        savedWrites.push(value);
      }
    },
    location: { protocol: "file:" },
    navigator: {},
    assert,
    __elements: elements,
    __createdAnchors: createdAnchors,
    savedStorage,
    savedWrites
  };

  vm.createContext(context);
  vm.runInContext(fs.readFileSync("app.js", "utf8"), context, { filename: "app.js" });
  return context;
}

const scenarioCode = `
  const assert = globalThis.assert;
  const testElements = globalThis.__elements;

  function setElement(selector, value) {
    document.querySelector(selector).value = value;
  }

  function prepareNewMatch(matchType) {
    setElement("#matchTypeSelect", matchType);
    setElement("#dialogTeamA", matchType === "singles" ? "検証 自分" : "検証 自チーム");
    setElement("#dialogTeamB", matchType === "singles" ? "検証 相手選手" : "検証 相手ペア");
    setElement("#dialogAFront", "検証 自前衛");
    setElement("#dialogARear", "検証 自後衛");
    setElement("#dialogBFront", "検証 相手前衛");
    setElement("#dialogBRear", "検証 相手後衛");
    setElement("#opponentFormationSelect", "雁行陣");
    setElement("#matchFormatSelect", "7");
    setElement("#matchDateInput", "2026-05-26");
    setElement("#matchTimeSelect", "午前");
    setElement("#matchStartTimeInput", "09:15");
    setElement("#matchEndTimeInput", "");
    setElement("#weatherSelect", "雪");
    setElement("#temperatureInput", "5℃未満");
    setElement("#windSelect", "強い");
    setElement("#surfaceSelect", "クレー");
    setElement("#courtConditionSelect", "湿っている");
    setElement("#eventInput", "練習試合");
    setElement("#tournamentInput", "県大会予選");
    setElement("#venueNameInput", "青葉公園庭球場");
    setElement("#venueInput", "第3コート");
    testElements.get("#shotSelect").value = "ストローク";
    testElements.get("#rallyInput").value = "3";
    testElements.get("#memoInput").value = "";
    newMatch();
  }

  function hasWonUnitForExpected(a, b, target) {
    return a >= target && a - b >= 2;
  }

  function applyExpected(expected, winner) {
    const loser = winner === "A" ? "B" : "A";
    const finalBefore = expected.games.A === 3 && expected.games.B === 3;
    expected.points[winner] += 1;
    const target = finalBefore ? 7 : 4;

    if (hasWonUnitForExpected(expected.points[winner], expected.points[loser], target)) {
      expected.games[winner] += 1;
      expected.points = { A: 0, B: 0 };
      expected.server = expected.server === "A" ? "B" : "A";
    } else if (finalBefore && (expected.points.A + expected.points.B) % 2 === 0) {
      expected.server = expected.server === "A" ? "B" : "A";
    }

    expected.finished = expected.games[winner] >= 4;
  }

  function assertScore(expected, label) {
    assert.equal(JSON.stringify(state.games), JSON.stringify(expected.games), label + " games");
    assert.equal(JSON.stringify(state.gamePoints), JSON.stringify(expected.points), label + " points");
    assert.equal(state.server, expected.server, label + " server");
    assert.equal(state.finished, expected.finished, label + " finished");
    assert.equal(String(testElements.get("#liveTeamAGames").textContent), String(expected.games.A), label + " live A games");
    assert.equal(String(testElements.get("#liveTeamBGames").textContent), String(expected.games.B), label + " live B games");
    if (!expected.finished) {
      const status = String(expected.games.A + expected.games.B + 1) + "G";
      assert.equal(testElements.get("#matchStatus").textContent, status, label + " compact match status");
      assert.equal(testElements.get("#liveMatchStatus").textContent, status, label + " compact live status");
    }
  }

  function runSevenGameFinalScenario(matchType) {
    prepareNewMatch(matchType);
    assert.equal(state.matchType, matchType, "match type");
    assert.equal(state.matchFormat, "7", "match format");
    assert.equal(state.gamesToWin, 4, "7ゲームマッチは4ゲーム先取");
    assert.equal(state.matchInfo.date, "2026-05-26", "date");
    assert.equal(state.matchInfo.startTime, "09:15", "start time");
    assert.equal(state.matchInfo.endTime, "", "end time starts empty");
    assert.equal(state.matchInfo.weather, "雪", "weather");
    assert.equal(state.matchInfo.temperature, "5℃未満", "temperature");
    assert.equal(state.matchInfo.wind, "強い", "wind");
    assert.equal(state.matchInfo.windSide, "未記録", "wind side is not set at match creation");
    assert.equal(state.matchInfo.surface, "クレー", "surface");
    assert.equal(state.matchInfo.courtCondition, "湿っている", "court condition");
    assert.equal(state.matchInfo.event, "練習試合", "event");
    assert.equal(state.matchInfo.tournament, "県大会予選", "tournament");
    assert.equal(state.matchInfo.venueName, "青葉公園庭球場", "venue name");
    assert.equal(state.matchInfo.venue, "第3コート", "venue");
    assert.equal(state.matchInfo.opponentFormation, matchType === "singles" ? "不明" : "雁行陣", "formation");
    assert.equal(state.selectedCourse, "未記録", "到達位置は初期状態で未記録");
    assert.equal(state.selectedResult, "不明", "ボールの結果は初期状態で不明");

    const sequence = [
      "A","A","A","A",
      "B","B","A","B","B",
      "A","B","A","B","A","A",
      "A","B","A","B","B","A","B","B",
      "A","B","A","B","A","B","A","B","A","A",
      "B","B","B","B",
      "A","B","A","B","A","B","A","B","A","B","A","B","A","A"
    ];
    const expected = { games: { A: 0, B: 0 }, points: { A: 0, B: 0 }, server: "A", finished: false };

    sequence.forEach((winner, index) => {
      const before = structuredClone(expected);
      addPoint(winner);
      applyExpected(expected, winner);
      assertScore(expected, matchType + " point " + (index + 1));
      const point = state.points[index];
      assert.equal(JSON.stringify(point.scoreBefore.games), JSON.stringify(before.games), "scoreBefore games point " + (index + 1));
      assert.equal(JSON.stringify(point.scoreBefore.points), JSON.stringify(before.points), "scoreBefore points point " + (index + 1));
      assert.equal(JSON.stringify(point.scoreAfter.games), JSON.stringify(expected.games), "scoreAfter games point " + (index + 1));
      assert.equal(JSON.stringify(point.scoreAfter.points), JSON.stringify(expected.points), "scoreAfter points point " + (index + 1));
      assert.equal(testElements.get("#recordStart").scrolled, true, "record scroll point " + (index + 1));
      assert.equal(testElements.get("#recordStart").focused, true, "record focus point " + (index + 1));
    });

    assert.equal(state.points.length, 51, "全51ポイントを記録");
    assert.equal(JSON.stringify(state.games), JSON.stringify({ A: 4, B: 3 }), "final match result");
    assert.equal(JSON.stringify(state.gamePoints), JSON.stringify({ A: 0, B: 0 }), "finished point reset");
    assert.equal(state.finished, true, "match finished");
    assert.match(state.matchInfo.endTime, /^\\d{2}:\\d{2}$/, "終了時刻は試合終了時に自動入力");
    assert.match(testElements.get("#matchStatus").innerHTML, /試合終了/, "finished status label");
    assert.match(testElements.get("#serverLabel").textContent, /自 勝ち/, "finished winner sub label");
    assert.equal(testElements.get("#liveMatchStatus").textContent, "終了", "finished live status");
    assert.match(testElements.get("#liveServerLabel").textContent, /自 勝ち/, "finished live result label");

    const finishedSnapshot = structuredClone({ games: state.games, points: state.gamePoints, count: state.points.length, server: state.server });
    addPoint("B");
    assert.equal(JSON.stringify({ games: state.games, points: state.gamePoints, count: state.points.length, server: state.server }), JSON.stringify(finishedSnapshot), "試合終了後は加点されない");

    undoPoint();
    assert.equal(state.finished, false, "最終ポイント取り消しで試合中へ戻る");
    assert.equal(state.matchInfo.endTime, "", "最終ポイント取り消しで終了時刻を戻す");
    assert.equal(JSON.stringify(state.games), JSON.stringify({ A: 3, B: 3 }), "最終ポイント取り消し games");
    assert.equal(JSON.stringify(state.gamePoints), JSON.stringify({ A: 7, B: 6 }), "最終ポイント取り消し points");

    addPoint("A");
    assert.equal(state.finished, true, "取り消し後に再加点で終了");
    assert.equal(JSON.stringify(state.games), JSON.stringify({ A: 4, B: 3 }), "取り消し後に再終了 games");
  }

  runSevenGameFinalScenario("doubles");
  runSevenGameFinalScenario("singles");

  const invalidSnapshot = structuredClone({ games: state.games, points: state.gamePoints, count: state.points.length });
  addPoint("X");
  assert.equal(JSON.stringify({ games: state.games, points: state.gamePoints, count: state.points.length }), JSON.stringify(invalidSnapshot), "不正な得点側は無視");

  state = structuredClone(defaultState);
  undoPoint();
  assert.equal(JSON.stringify(state.games), JSON.stringify({ A: 0, B: 0 }), "空履歴の取り消しは安全");

  setElement("#matchTypeSelect", "doubles");
  setElement("#dialogTeamA", "   ");
  setElement("#dialogTeamB", "");
  setElement("#dialogAFront", "");
  setElement("#dialogARear", "");
  setElement("#dialogBFront", "");
  setElement("#dialogBRear", "");
  setElement("#matchFormatSelect", "invalid");
  setElement("#matchDateInput", "");
  setElement("#matchTimeSelect", "未記録");
  setElement("#matchStartTimeInput", "");
  setElement("#matchEndTimeInput", "");
  setElement("#weatherSelect", "未記録");
  setElement("#temperatureInput", "");
  setElement("#windSelect", "未記録");
  setElement("#surfaceSelect", "未記録");
  setElement("#courtConditionSelect", "未記録");
  setElement("#opponentFormationSelect", "不明");
  setElement("#eventInput", "未記録");
  setElement("#tournamentInput", "未記録");
  setElement("#venueNameInput", "未記録");
  setElement("#venueInput", "未記録");
  newMatch();
  assert.equal(state.teams.A, "自チーム", "空の自チーム名は既定値");
  assert.equal(state.teams.B, "相手ペア", "空の相手名は既定値");
  assert.match(state.matchInfo.startTime, /^\\d{2}:\\d{2}$/, "開始時刻は未入力なら自動入力");
  assert.equal(state.gamesToWin, 4, "不明な試合形式は7ゲーム相当の4ゲーム先取にフォールバック");
  state.points = [{ winner: "A" }];
  setElement("#dialogTeamA", "修正 自チーム");
  setElement("#matchStartTimeInput", "08:45");
  setElement("#matchEndTimeInput", "09:30");
  updateMatchInfo();
  assert.equal(state.teams.A, "修正 自チーム", "試合情報編集でチーム名を修正");
  assert.equal(state.matchInfo.startTime, "08:45", "試合情報編集で開始時刻を修正");
  assert.equal(state.matchInfo.endTime, "09:30", "試合情報編集で終了時刻を修正");
  assert.equal(state.points.length, 1, "試合情報編集では履歴を消さない");
  resetMatchDialogFields();
  assert.equal(testElements.get("#dialogTeamA").value, "自チーム", "リセットで自チーム名を初期値へ戻す");
  assert.equal(testElements.get("#dialogARear").value, "自後衛", "リセットで後衛名を初期値へ戻す");
  assert.equal(testElements.get("#matchFormatSelect").value, "7", "リセットで試合形式を7ゲームへ戻す");
  assert.equal(testElements.get("#venueInput").value, "未記録", "リセットでコートを未記録へ戻す");
  newMatch();
  const archivedMatches = loadArchivedMatches();
  assert.equal(archivedMatches.length >= 1, true, "新規試合前に記録済み試合を自動保存");
  assert.equal(archivedMatches[0].state.teams.A, "修正 自チーム", "保存済み試合に直前の入力データを残す");
  assert.equal(archivedMatches[0].pointCount, 1, "保存済み試合にポイント数を残す");
  const archiveFixture = [
    {
      id: "archive-1",
      savedAt: "2026-05-28T10:00:00.000Z",
      title: "2026-05-28 / 春季大会 / 青チーム vs 赤チーム / 4-2",
      pointCount: 12,
      finished: true,
      state: {
        teams: { A: "青チーム", B: "赤チーム" },
        players: { ARear: "青 後衛", AFront: "青 前衛", BRear: "赤 後衛", BFront: "赤 前衛" },
        matchInfo: { date: "2026-05-28", tournament: "春季大会", venueName: "中央公園" }
      }
    },
    {
      id: "archive-2",
      savedAt: "2026-05-27T10:00:00.000Z",
      title: "2026-05-27 / 練習試合 / 白チーム vs 黒チーム / 2-4",
      pointCount: 8,
      finished: false,
      state: {
        teams: { A: "白チーム", B: "黒チーム" },
        players: { ARear: "白 後衛", AFront: "白 前衛", BRear: "黒 後衛", BFront: "黒 前衛" },
        matchInfo: { date: "2026-05-27", tournament: "練習試合", venueName: "南コート" }
      }
    }
  ];
  saveArchivedMatches(archiveFixture);
  assert.equal(filterArchivedMatches(loadArchivedMatches(), "春季").length, 1, "保存済み試合を大会名で検索");
  assert.equal(filterArchivedMatches(loadArchivedMatches(), "黒チーム")[0].id, "archive-2", "保存済み試合を相手名で検索");
  assert.deepEqual(sortArchivedMatches(loadArchivedMatches(), "newest").map((entry) => entry.id), ["archive-1", "archive-2"], "保存済み試合を新しい順で並べる");
  assert.deepEqual(sortArchivedMatches(loadArchivedMatches(), "oldest").map((entry) => entry.id), ["archive-2", "archive-1"], "保存済み試合を古い順で並べる");
  assert.deepEqual(sortArchivedMatches(loadArchivedMatches(), "title").map((entry) => entry.id), ["archive-2", "archive-1"], "保存済み試合を名前順で並べる");
  testElements.get("#archiveSearchInput").value = "春季";
  testElements.get("#archiveSortSelect").value = "newest";
  renderArchivedMatches();
  assert.equal(testElements.get("#archiveCountLabel").textContent, "1/2件", "検索時に絞り込み件数を表示");
  assert.match(testElements.get("#archivedMatchList").innerHTML, /青チーム/, "検索結果に該当試合を表示");
  assert.doesNotMatch(testElements.get("#archivedMatchList").innerHTML, /黒チーム/, "検索結果から非該当試合を非表示");
  window.confirm = () => false;
  assert.equal(deleteArchivedMatch("archive-1"), false, "削除キャンセル時は削除しない");
  assert.equal(loadArchivedMatches().length, 2, "削除キャンセル時は件数を維持");
  window.confirm = () => true;
  assert.equal(deleteArchivedMatch("archive-1"), true, "保存済み試合を削除できる");
  assert.equal(loadArchivedMatches().length, 1, "削除後に件数が減る");
  assert.equal(loadArchivedMatches()[0].id, "archive-2", "対象試合だけ削除する");
  assert.equal(getCurrentTimeOfDay(new Date("2026-05-26T08:00:00")), "朝", "8時台は朝");
  assert.equal(getCurrentTimeOfDay(new Date("2026-05-26T10:00:00")), "午前", "10時台は午前");
  assert.equal(getCurrentTimeOfDay(new Date("2026-05-26T14:00:00")), "午後", "14時台は午後");

  state = structuredClone(defaultState);
  state.selectedCourse = "右奥";
  state.selectedResult = "イン";
  applyOutcomePreset("ダブルフォールト");
  assert.equal(state.selectedCourse, "未記録", "DF時は到達位置を未記録へ戻す");
  assert.equal(state.selectedResult, "不明", "DF時はボール結果を不明へ戻す");
  assert.equal(inferResultFromCourse("左奥"), "イン", "コート内の到達位置はインへ寄せる");
  assert.equal(inferResultFromCourse("ネット"), "ネット", "ネット到達はネット");
  assert.equal(inferResultFromCourse("左サイドアウト"), "サイドアウト", "サイドアウト到達はサイドアウト");
  assert.equal(inferResultFromCourse("バックアウト"), "バックアウト", "バックアウト到達はバックアウト");
  assert.equal(
    getCsvFileName(new Date("2026-05-28T10:11:12")).startsWith("soft-tennis-points-20260528101112-"),
    true,
    "CSVファイル名に年月日時分秒を含める"
  );
  state = structuredClone(defaultState);
  state.teams.A = "バックアップ自チーム";
  state.points = [{ winner: "A", scoreBefore: { games: { A: 0, B: 0 }, points: { A: 0, B: 0 } }, scoreAfter: { games: { A: 0, B: 0 }, points: { A: 1, B: 0 } } }];
  saveArchivedMatches(archiveFixture);
  const backup = createBackupPayload();
  assert.equal(backup.app, "soft-tennis-note", "バックアップにアプリ識別子を含める");
  assert.equal(backup.state.teams.A, "バックアップ自チーム", "バックアップに現在の試合を含める");
  assert.equal(backup.archivedMatches.length, 2, "バックアップに保存済み試合を含める");
  state = structuredClone(defaultState);
  saveArchivedMatches([]);
  const restored = restoreBackupPayload(backup);
  assert.equal(state.teams.A, "バックアップ自チーム", "バックアップから現在の試合を復元する");
  assert.equal(restored.archivedMatches.length, 2, "バックアップから保存済み試合を復元する");
  assert.equal(loadArchivedMatches().length, 2, "復元後に保存済み試合をlocalStorageへ保存する");
  assert.throws(() => restoreBackupPayload({ app: "other" }), /バックアップJSON/, "別形式のJSONは復元しない");
`;

createAppContext();
vm.runInContext(scenarioCode, createAppContext(), { filename: "match-flow.scenario.js" });

const brokenStorageContext = createAppContext("{broken json");
vm.runInContext(
  `
    assert.equal(JSON.stringify(state.games), JSON.stringify({ A: 0, B: 0 }), "壊れた保存データは初期状態へフォールバック");
    assert.equal(state.finished, false, "壊れた保存データで終了扱いにならない");
  `,
  brokenStorageContext,
  { filename: "broken-storage.scenario.js" }
);

const partialStorageContext = createAppContext(JSON.stringify({
  teams: { A: "保存済み自チーム" },
  games: { A: "2" },
  gamePoints: { B: 3 },
  points: "invalid",
  matchInfo: null
}));
vm.runInContext(
  `
    assert.equal(state.teams.A, "保存済み自チーム", "部分的な保存データのチーム名を残す");
    assert.equal(state.teams.B, "相手ペア", "欠けた相手名は既定値へフォールバック");
    assert.deepEqual(state.games, { A: 2, B: 0 }, "欠けたゲーム数は0へフォールバック");
    assert.deepEqual(state.gamePoints, { A: 0, B: 3 }, "欠けたポイント数は0へフォールバック");
    assert.deepEqual(state.points, [], "配列でない履歴は空配列へフォールバック");
    assert.equal(state.matchInfo.weather, "未記録", "不正な試合情報は既定値へフォールバック");
  `,
  partialStorageContext,
  { filename: "partial-storage.scenario.js" }
);

const shareAbortContext = createAppContext();
const shareAbortPromise = vm.runInContext(
  `
    (async () => {
      document.querySelector("#summaryPreviewImage").src = "data:image/png;base64,AAAA";
      navigator.canShare = () => true;
      navigator.share = async () => {
        const error = new Error("cancel");
        error.name = "AbortError";
        throw error;
      };
      await shareSummaryPreview();
      assert.equal(globalThis.__createdAnchors.length, 0, "共有キャンセルだけでは画像保存へ切り替えない");
    })()
  `,
  shareAbortContext,
  { filename: "share-abort.scenario.js" }
);

shareAbortPromise
  .then(() => {
    console.log("match-flow: ok");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
