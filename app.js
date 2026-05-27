const STORAGE_KEY = "soft-tennis-logger-state-v1";
const SCORING_OUTCOMES = ["ストローク得点", "ボレー得点", "スマッシュ得点", "サービス得点", "レシーブ得点", "ロビング得点"];
const ERROR_OUTCOMES = ["ダブルフォールト", "レシーブミス", "ストロークミス", "ボレーミス", "スマッシュミス", "その他"];
const TRIAL_GUIDES = {
  record: {
    summary: "テスト利用の説明（記録）",
    lead: "記録ページは、試合を見ている人がポイント後すぐに残す画面です。選手本人が試合中に入力する想定ではありません。",
    items: [
      "サービス開始（1st/2nd/DF）を確認する",
      "ポイント内容、プレイヤー、得点側を選ぶ",
      "到達位置やメモは、余裕がある時だけ詳細記録に残す"
    ]
  },
  analysis: {
    summary: "テスト利用の説明（分析）",
    lead: "分析ページは、試合中の短い確認と、試合後の振り返りに使う画面です。",
    items: [
      "上から順に、今の状況で気になる点を確認する",
      "相手のミス、自チームの失点、序盤の失点を分けて見る",
      "残したい内容は「この分析を保存」で保存する"
    ]
  },
  history: {
    summary: "テスト利用の説明（履歴）",
    lead: "履歴ページは、入力ミスの確認と、試合後に1点ずつ振り返るための画面です。",
    items: [
      "直近のポイントから順に、得点側・内容・プレイヤーを確認する",
      "スコア推移を見て、どの場面で流れが変わったか確認する",
      "直前の入力を直したい時は、記録ページの「前のポイントに戻す」を使う"
    ]
  }
};

const defaultState = {
  matchType: "doubles",
  teams: { A: "自チーム", B: "相手ペア" },
  players: {
    AFront: "自前衛",
    ARear: "自後衛",
    BFront: "相手前衛",
    BRear: "相手後衛"
  },
  gamesToWin: 4,
  matchFormat: "7",
  matchInfo: {
    date: "",
    timeOfDay: "未記録",
    startTime: "",
    endTime: "",
    weather: "未記録",
    temperature: "",
    wind: "未記録",
    windSide: "未記録",
    surface: "未記録",
    courtCondition: "未記録",
    opponentFormation: "雁行陣",
    event: "",
    tournament: "",
    venueName: "",
    venue: ""
  },
  server: "A",
  selectedCourse: "未記録",
  selectedOutcome: "ストローク得点",
  selectedResult: "不明",
  selectedServe: "第1サービスで開始",
  selectedHand: "不明",
  selectedPlayer: "不明",
  analysisMemos: [],
  points: [],
  gamePoints: { A: 0, B: 0 },
  games: { A: 0, B: 0 },
  finished: false
};

let state = loadState();
let matchDialogMode = "new";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

const elements = {
  teamAName: $("#teamAName"),
  teamBName: $("#teamBName"),
  teamALabel: $(".team-a label"),
  teamBLabel: $(".team-b label"),
  teamAGames: $("#teamAGames"),
  teamBGames: $("#teamBGames"),
  teamAPoints: $("#teamAPoints"),
  teamBPoints: $("#teamBPoints"),
  liveTeamAName: $("#liveTeamAName"),
  liveTeamBName: $("#liveTeamBName"),
  liveTeamAGames: $("#liveTeamAGames"),
  liveTeamBGames: $("#liveTeamBGames"),
  liveTeamAPoints: $("#liveTeamAPoints"),
  liveTeamBPoints: $("#liveTeamBPoints"),
  liveMatchStatus: $("#liveMatchStatus"),
  liveServerLabel: $("#liveServerLabel"),
  matchStatus: $("#matchStatus"),
  matchInfo: $("#matchInfo"),
  matchAlert: $("#matchAlert"),
  serverLabel: $("#serverLabel"),
  startGuide: $(".start-guide"),
  nextStep: $("#nextStep"),
  screenGuide: $("#screenGuide"),
  trialGuideSummary: $("#trialGuideSummary"),
  trialGuideLead: $("#trialGuideLead"),
  trialGuideList: $("#trialGuideList"),
  ruleNote: $("#ruleNote"),
  courtModeLabel: $("#courtModeLabel"),
  shotSelect: $("#shotSelect"),
  rallyInput: $("#rallyInput"),
  memoInput: $("#memoInput"),
  analysisSummary: $("#analysisSummary"),
  scoreQuality: $("#scoreQuality"),
  coachNotes: $("#coachNotes"),
  opponentView: $("#opponentView"),
  saveAnalysisMemoButton: $("#saveAnalysisMemoButton"),
  analysisMemoList: $("#analysisMemoList"),
  statsGrid: $("#statsGrid"),
  scoringBars: $("#scoringBars"),
  opponentErrorBars: $("#opponentErrorBars"),
  errorBars: $("#errorBars"),
  resultBars: $("#resultBars"),
  phaseBars: $("#phaseBars"),
  handBars: $("#handBars"),
  playerBars: $("#playerBars"),
  courseBars: $("#courseBars"),
  pointList: $("#pointList"),
  historyFilterSelect: $("#historyFilterSelect"),
  historySortSelect: $("#historySortSelect"),
  historyDateLabel: $("#historyDateLabel"),
  dialog: $("#newMatchDialog"),
  actionMenuDialog: $("#actionMenuDialog"),
  summaryImageDialog: $("#summaryImageDialog"),
  summaryPreviewImage: $("#summaryPreviewImage"),
  menuButton: $("#menuButton"),
  openNewMatchButton: $("#openNewMatchButton"),
  editMatchInfoButton: $("#editMatchInfoButton"),
  previewSummaryImageButton: $("#previewSummaryImageButton"),
  downloadSummaryImageButton: $("#downloadSummaryImageButton"),
  exportCsvButton: $("#exportCsvButton"),
  matchTypeSelect: $("#matchTypeSelect"),
  dialogTeamA: $("#dialogTeamA"),
  dialogTeamB: $("#dialogTeamB"),
  matchDialogTitle: $("#matchDialogTitle"),
  dialogTeamALabel: $("#dialogTeamALabel"),
  dialogTeamBLabel: $("#dialogTeamBLabel"),
  dialogAFront: $("#dialogAFront"),
  dialogARear: $("#dialogARear"),
  dialogBFront: $("#dialogBFront"),
  dialogBRear: $("#dialogBRear"),
  opponentFormationSelect: $("#opponentFormationSelect"),
  matchFormatSelect: $("#matchFormatSelect"),
  matchDateInput: $("#matchDateInput"),
  matchTimeSelect: $("#matchTimeSelect"),
  matchStartTimeInput: $("#matchStartTimeInput"),
  matchEndTimeInput: $("#matchEndTimeInput"),
  weatherSelect: $("#weatherSelect"),
  temperatureInput: $("#temperatureInput"),
  windSelect: $("#windSelect"),
  surfaceSelect: $("#surfaceSelect"),
  courtConditionSelect: $("#courtConditionSelect"),
  eventInput: $("#eventInput"),
  tournamentInput: $("#tournamentInput"),
  venueNameInput: $("#venueNameInput"),
  venueInput: $("#venueInput")
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState({ ...structuredClone(defaultState), ...saved });
  } catch {
    return structuredClone(defaultState);
  }
}

function normalizeState(saved) {
  const outcomeAliases = {
    "相手ミス": "相手の失ポイント",
    "自チームミス": "自チームの失ポイント",
    "エース": "サービス得点",
    "サービスエース": "サービス得点",
    "レシーブエース": "レシーブ得点",
    "相手の失ポイント": "ストロークミス",
    "自チームの失ポイント": "ストロークミス",
    "決定打": "ストローク得点",
    "ウィナー": "ストローク得点",
    "ストローク決定": "ストローク得点",
    "ボレー決定": "ボレー得点",
    "スマッシュ決定": "スマッシュ得点",
    "相手を崩した": "ストローク得点",
    "ダブルフォルト": "ダブルフォールト"
  };
  const courseAliases = {
    "左深": "左奥",
    "中央深": "中央奥",
    "右深": "右奥",
    "逆クロス深": "左奥",
    "センター深": "中央奥",
    "順クロス深": "右奥",
    "逆クロス前": "左前",
    "センター前": "中央前",
    "順クロス前": "右前",
    "サイド側アウト": "右サイドアウト",
    "ベースライン側アウト": "バックアウト",
    "ベースライン奥アウト": "バックアウト"
  };
  const resultAliases = {
    "コート内": "イン",
    "アウト": "バックアウト",
    "ベースライン側アウト": "バックアウト",
    "サイド側アウト": "サイドアウト"
  };

  saved.selectedOutcome = outcomeAliases[saved.selectedOutcome] || saved.selectedOutcome || defaultState.selectedOutcome;
  saved.selectedCourse = courseAliases[saved.selectedCourse] || saved.selectedCourse || defaultState.selectedCourse;
  saved.selectedResult = resultAliases[saved.selectedResult] || saved.selectedResult || defaultState.selectedResult;
  saved.selectedServe = saved.selectedServe || (saved.firstServeIn === false ? "第2サービスで開始" : defaultState.selectedServe);
  saved.matchType = saved.matchType || defaultState.matchType;
  saved.matchFormat = saved.matchFormat || matchFormatFromGamesToWin(saved.gamesToWin);
  saved.gamesToWin = gamesToWinFromFormat(saved.matchFormat);
  saved.matchInfo = { ...defaultState.matchInfo, ...(saved.matchInfo || {}) };
  saved.selectedHand = saved.selectedHand || defaultState.selectedHand;
  saved.selectedPlayer = saved.selectedPlayer || saved.selectedRole || defaultState.selectedPlayer;
  saved.analysisMemos = Array.isArray(saved.analysisMemos) ? saved.analysisMemos : [];
  saved.players = { ...defaultState.players, ...(saved.players || {}) };
  saved.points = (saved.points || []).map((point) => ({
    ...point,
    outcome: outcomeAliases[point.outcome] || point.outcome,
    course: courseAliases[point.course] || point.course,
    result: resultAliases[point.result] || point.result || inferResult(point.outcome),
    serveStart: point.serveStart || getLegacyServeStart(point),
    firstServeIn: point.firstServeIn !== undefined ? point.firstServeIn : getLegacyServeStart(point) === "第1サービスで開始",
    shot: point.shot === "ロブ" ? "ロビング" : point.shot,
    hand: normalizeHand(point.hand),
    player: point.player || point.role || "不明",
    phase: point.phase || getPhaseLabel(point.scoreBefore?.points || { A: 0, B: 0 })
  }));
  return saved;
}

function normalizeHand(hand) {
  const aliases = {
    "フォア": "フォアハンド",
    "バック": "バックハンド",
    "正面": "正面処理"
  };
  return aliases[hand] || hand || "不明";
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getLegacyServeStart(point) {
  if (point?.outcome === "ダブルフォールト" || point?.outcome === "ダブルフォルト") return "ダブルフォールト";
  return point?.firstServeIn === false ? "第2サービスで開始" : "第1サービスで開始";
}

function gamesToWinFromFormat(format) {
  if (format === "5") return 3;
  if (format === "9") return 5;
  if (format === "final") return 1;
  return 4;
}

function matchFormatFromGamesToWin(gamesToWin) {
  if (gamesToWin === 3) return "5";
  if (gamesToWin === 5) return "9";
  if (gamesToWin === 1) return "final";
  return "7";
}

function matchFormatLabel() {
  if (state.matchFormat === "final") return "ファイナルゲームのみ";
  return `${state.matchFormat}ゲームマッチ`;
}

function isFinalGame() {
  if (state.matchFormat === "final") return true;
  return state.games.A === state.gamesToWin - 1 && state.games.B === state.gamesToWin - 1;
}

function getPointTarget() {
  return isFinalGame() ? 7 : 4;
}

function getPointTargetForRecordedPoint(point) {
  if (state.matchFormat === "final") return 7;
  const games = point.scoreBefore?.games || { A: 0, B: 0 };
  return games.A === state.gamesToWin - 1 && games.B === state.gamesToWin - 1 ? 7 : 4;
}

function hasWonUnit(a, b, target) {
  return a >= target && a - b >= 2;
}

function winsCurrentGameOnNextPoint(team) {
  const opponent = team === "A" ? "B" : "A";
  return hasWonUnit(state.gamePoints[team] + 1, state.gamePoints[opponent], getPointTarget());
}

function getMatchPointTeams() {
  if (state.finished) return [];
  return ["A", "B"].filter((team) => winsCurrentGameOnNextPoint(team) && state.games[team] + 1 >= state.gamesToWin);
}

function pointLabel(team) {
  const target = getPointTarget();
  const own = state.gamePoints[team];
  const other = state.gamePoints[team === "A" ? "B" : "A"];
  if (own >= target - 1 && other >= target - 1 && own === other) return `${own} D`;
  if (own >= target && own === other + 1) return `${own} A`;
  return String(own);
}

function displayName(team) {
  return state.teams[team] || (team === "A" ? ownDefaultName() : opponentDefaultName());
}

function shortDisplayName(team) {
  const fallback = team === "A" ? ownDefaultName() : opponentDefaultName();
  const name = (state.teams[team] || fallback).trim();
  if (!name) return fallback;
  if (["自ペア", "自チーム", "自分", "相手", "相手ペア", "相手選手"].includes(name)) return name.replace("選手", "");
  const compact = name.replace(/\s+/g, "").replace(/ペア$/, "").replace(/チーム$/, "");
  return [...compact].slice(0, 4).join("");
}

function shortSideName(team) {
  return team === "A" ? "自" : "相";
}

function ownDefaultName() {
  return state.matchType === "singles" ? "自分" : "自チーム";
}

function opponentDefaultName() {
  return state.matchType === "singles" ? "相手選手" : "相手ペア";
}

function ownSideLabel() {
  return state.matchType === "singles" ? "自分" : "自チーム";
}

function playerLabel(player) {
  const labels = {
    A後衛: state.players.ARear,
    A前衛: state.players.AFront,
    B後衛: state.players.BRear,
    B前衛: state.players.BFront,
    A選手: displayName("A"),
    B選手: displayName("B")
  };
  return labels[player] || player || "不明";
}

function getPhaseLabel(points) {
  const total = (points.A || 0) + (points.B || 0);
  if (total <= 1) return "ゲーム序盤";
  if (total <= 3) return "ゲーム中盤";
  return "ゲーム終盤";
}

function isOpeningPointLoss(point) {
  const points = point.scoreBefore?.points || { A: 0, B: 0 };
  return (points.A || 0) + (points.B || 0) <= 1;
}

function isDeuceOrLaterLoss(point) {
  const target = getPointTargetForRecordedPoint(point);
  const points = point.scoreBefore?.points || { A: 0, B: 0 };
  return points.A >= target - 1 && points.B >= target - 1;
}

function isGamePointAreaLoss(point) {
  if (isDeuceOrLaterLoss(point)) return false;
  const target = getPointTargetForRecordedPoint(point);
  const points = point.scoreBefore?.points || { A: 0, B: 0 };
  return points.A >= target - 1 || points.B >= target - 1;
}

function getGameNumber(games) {
  return (games.A || 0) + (games.B || 0) + 1;
}

function switchServer() {
  state.server = state.server === "A" ? "B" : "A";
}

function addPoint(winner) {
  if (!["A", "B"].includes(winner)) return;
  if (state.finished) return;

  const loser = winner === "A" ? "B" : "A";
  const finalGameBeforePoint = isFinalGame();
  const entry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    winner,
    server: state.server,
    course: state.selectedCourse,
    outcome: state.selectedOutcome,
    result: state.selectedResult,
    serveStart: state.selectedServe,
    hand: state.selectedHand,
    player: state.selectedPlayer,
    shot: elements.shotSelect.value,
    rally: elements.rallyInput.value || "0",
    firstServeIn: state.selectedServe === "第1サービスで開始",
    memo: elements.memoInput.value.trim(),
    phase: getPhaseLabel(state.gamePoints),
    gameNumber: getGameNumber(state.games),
    endTimeBefore: state.matchInfo?.endTime || "",
    scoreBefore: {
      games: { ...state.games },
      points: { ...state.gamePoints }
    }
  };

  state.gamePoints[winner] += 1;
  const target = getPointTarget();

  if (hasWonUnit(state.gamePoints[winner], state.gamePoints[loser], target)) {
    state.games[winner] += 1;
    state.gamePoints = { A: 0, B: 0 };
    entry.gameWonBy = winner;
    switchServer();
  } else if (finalGameBeforePoint && (state.gamePoints.A + state.gamePoints.B) % 2 === 0) {
    switchServer();
  }

  if (state.games[winner] >= state.gamesToWin) {
    state.finished = true;
    if (!state.matchInfo.endTime) {
      state.matchInfo.endTime = getCurrentClockTime();
    }
  }

  entry.scoreAfter = {
    games: { ...state.games },
    points: { ...state.gamePoints }
  };
  state.points.push(entry);
  elements.memoInput.value = "";
  saveState();
  render();
  moveToNextPointInput();
}

function moveToNextPointInput() {
  const target = $("#recordStart");
  if (!target) return;
  const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    target.focus({ preventScroll: true });
  });
}

function undoPoint() {
  const last = state.points.pop();
  if (!last) return;
  state.games = { ...last.scoreBefore.games };
  state.gamePoints = { ...last.scoreBefore.points };
  state.server = last.server;
  state.matchInfo.endTime = last.endTimeBefore || "";
  state.finished = false;
  saveState();
  render();
}

function applyMatchDialogValues({ resetMatch }) {
  if (resetMatch) {
    state = structuredClone(defaultState);
  }
  state.matchType = elements.matchTypeSelect.value;
  state.teams.A = elements.dialogTeamA.value.trim() || ownDefaultName();
  state.teams.B = elements.dialogTeamB.value.trim() || opponentDefaultName();
  state.players.AFront = elements.dialogAFront.value.trim() || "自前衛";
  state.players.ARear = elements.dialogARear.value.trim() || "自後衛";
  state.players.BFront = elements.dialogBFront.value.trim() || "相手前衛";
  state.players.BRear = elements.dialogBRear.value.trim() || "相手後衛";
  if (resetMatch) {
    state.selectedPlayer = "不明";
    state.analysisMemos = [];
    state.points = [];
    state.gamePoints = { A: 0, B: 0 };
    state.games = { A: 0, B: 0 };
    state.finished = false;
  }
  state.matchFormat = elements.matchFormatSelect.value;
  state.gamesToWin = gamesToWinFromFormat(state.matchFormat);
  state.matchInfo = {
    date: elements.matchDateInput.value,
    timeOfDay: elements.matchTimeSelect.value,
    startTime: elements.matchStartTimeInput.value || (resetMatch ? getCurrentClockTime() : state.matchInfo.startTime || ""),
    endTime: elements.matchEndTimeInput.value,
    weather: elements.weatherSelect.value,
    temperature: elements.temperatureInput.value,
    wind: elements.windSelect.value,
    windSide: "未記録",
    surface: elements.surfaceSelect.value,
    courtCondition: elements.courtConditionSelect.value,
    opponentFormation: state.matchType === "singles" ? "不明" : elements.opponentFormationSelect.value,
    event: elements.eventInput.value,
    tournament: elements.tournamentInput.value.trim(),
    venueName: elements.venueNameInput.value.trim(),
    venue: elements.venueInput.value
  };
  saveState();
  render();
}

function newMatch() {
  applyMatchDialogValues({ resetMatch: true });
}

function updateMatchInfo() {
  applyMatchDialogValues({ resetMatch: false });
}

function setActiveButton(containerSelector, dataName, value) {
  $$(`${containerSelector} button`).forEach((button) => {
    button.classList.toggle("active", button.dataset[dataName] === value);
  });
}

function renderScore() {
  elements.teamALabel.textContent = ownDefaultName();
  elements.teamBLabel.textContent = opponentDefaultName();
  elements.teamAName.value = state.teams.A;
  elements.teamBName.value = state.teams.B;
  elements.teamAGames.textContent = state.games.A;
  elements.teamBGames.textContent = state.games.B;
  elements.teamAPoints.textContent = pointLabel("A");
  elements.teamBPoints.textContent = pointLabel("B");
  elements.serverLabel.textContent = `S ${shortSideName(state.server)}`;
  elements.serverLabel.title = `サービス: ${displayName(state.server)}`;
  renderLiveScore();
  renderMatchPointAlert();
  $(".point-button.own").innerHTML = `${escapeHtml(displayName("A"))}<br />1ポイント`;
  $(".point-button.opp").innerHTML = `${escapeHtml(displayName("B"))}<br />1ポイント`;
  renderPlayerButtons();
  renderCourtMode();
  renderMatchInfo();

  if (state.finished) {
    const winner = getWinnerTeam();
    elements.matchStatus.innerHTML = winner
      ? `<span class="winner-label">WINNER</span><span class="winner-side">${escapeHtml(shortSideName(winner))}</span>`
      : `<span class="winner-label">END</span>`;
    elements.serverLabel.textContent = "試合終了";
    elements.serverLabel.title = winner ? `WINNER: ${displayName(winner)}` : "試合終了";
  } else if (state.matchFormat === "final") {
    elements.matchStatus.innerHTML = "";
    elements.matchStatus.textContent = "FG";
  } else {
    elements.matchStatus.innerHTML = "";
    elements.matchStatus.textContent = getCompactMatchStatus();
  }

  elements.liveMatchStatus.textContent = getCompactMatchStatus();

  renderScreenGuide();
  elements.ruleNote.textContent = getRuleNoteText();

  setActiveButton("#serverControl", "server", state.server);
  setActiveButton("#serveControl", "serve", state.selectedServe);
  setActiveButton("#outcomeControl", "outcome", state.selectedOutcome);
  setActiveButton("#resultControl", "result", state.selectedResult);
  setActiveButton("#handControl", "hand", state.selectedHand);
  setActiveButton("#playerControl", "player", state.selectedPlayer);
  $$(".half-court button").forEach((button) => {
    button.classList.toggle("active", button.dataset.course === state.selectedCourse);
  });
  if (state.selectedCourse === "未記録") {
    $$(".half-court button").forEach((button) => button.classList.remove("active"));
  }
}

function renderLiveScore() {
  elements.liveTeamAName.textContent = state.matchType === "singles" ? "自" : "自";
  elements.liveTeamAName.title = displayName("A");
  elements.liveTeamBName.textContent = "相";
  elements.liveTeamBName.title = displayName("B");
  elements.liveTeamAGames.textContent = state.games.A;
  elements.liveTeamBGames.textContent = state.games.B;
  elements.liveTeamAPoints.textContent = pointLabel("A");
  elements.liveTeamBPoints.textContent = pointLabel("B");
  if (state.finished) {
    const winner = getWinnerTeam();
    elements.liveServerLabel.textContent = winner ? `WIN ${shortSideName(winner)}` : "試合終了";
    elements.liveServerLabel.title = winner ? `WINNER: ${displayName(winner)}` : "試合終了";
  } else {
    elements.liveServerLabel.textContent = `S ${shortSideName(state.server)}`;
    elements.liveServerLabel.title = `サービス: ${displayName(state.server)}`;
  }
}

function renderMatchPointAlert() {
  const teams = getMatchPointTeams();
  const visible = teams.length > 0;
  document.body.classList.toggle("match-point", visible);
  elements.matchAlert.hidden = !visible;
  if (!visible) {
    elements.matchAlert.textContent = "";
    return;
  }

  const teamNames = teams.map(displayName).join("・");
  const gameLabel = state.matchFormat === "final" || isFinalGame() ? "FG" : getCompactMatchStatus();
  elements.matchAlert.innerHTML = `
    <strong>マッチポイント: ${escapeHtml(teamNames)}</strong>
    <span>${escapeHtml(gameLabel)}。次の1ポイントで試合が決まります。</span>
  `;
}

function renderCourtMode() {
  const singles = state.matchType === "singles";
  $(".court").classList.toggle("singles-court", singles);
  $(".court").classList.toggle("doubles-court", !singles);
  const courtLabel = singles ? "シングルス半面コート" : "ダブルス半面コート";
  elements.courtModeLabel.textContent = state.selectedCourse === "未記録" ? `${courtLabel}・未記録でもOK` : courtLabel;
}

function getCompactMatchStatus() {
  if (state.finished) return "END";
  if (state.matchFormat === "final") return "FG";
  return `${state.games.A + state.games.B + 1}G`;
}

function getWinnerTeam() {
  if (!state.finished || state.games.A === state.games.B) return "";
  return state.games.A > state.games.B ? "A" : "B";
}

function renderMatchInfo() {
  const info = state.matchInfo || defaultState.matchInfo;
  const weather = [info.weather, info.temperature ? `${info.temperature}℃` : "", info.wind !== "未記録" ? `風:${info.wind}` : ""]
    .filter(Boolean)
    .filter((item) => item !== "未記録")
    .join(" / ");
  const court = [info.surface !== "未記録" ? info.surface : "", info.courtCondition !== "未記録" ? info.courtCondition : ""].filter(Boolean).join(" / ");
  const matchTypeLabel = state.matchType === "singles" ? "シングルス" : "ダブルス";
  const tournament = info.tournament && info.tournament !== "未記録" ? info.tournament : "";
  const venueName = info.venueName && info.venueName !== "未記録" ? info.venueName : "";
  const timeRange = getMatchTimeRange(info);
  const rows = [
    matchTypeLabel,
    matchFormatLabel(),
    info.date,
    info.timeOfDay !== "未記録" ? info.timeOfDay : "",
    timeRange,
    weather,
    court,
    state.matchType !== "singles" && info.opponentFormation !== "不明" ? `相手:${info.opponentFormation}` : "",
    info.event !== "未記録" ? info.event : "",
    tournament,
    venueName,
    info.venue !== "未記録" ? info.venue : ""
  ].filter(Boolean);
  elements.matchInfo.textContent = rows.length ? rows.join(" ・ ") : matchFormatLabel();
}

function renderPlayerButtons() {
  const singles = state.matchType === "singles";
  $("#playerARearButton").hidden = singles;
  $("#playerAFrontButton").hidden = singles;
  $("#playerBRearButton").hidden = singles;
  $("#playerBFrontButton").hidden = singles;
  $("#playerASinglesButton").hidden = !singles;
  $("#playerBSinglesButton").hidden = !singles;
  $("#playerARearButton").innerHTML = formatPlayerButtonLabel(playerLabel("A後衛"));
  $("#playerAFrontButton").innerHTML = formatPlayerButtonLabel(playerLabel("A前衛"));
  $("#playerBRearButton").innerHTML = formatPlayerButtonLabel(playerLabel("B後衛"));
  $("#playerBFrontButton").innerHTML = formatPlayerButtonLabel(playerLabel("B前衛"));
  $("#playerASinglesButton").textContent = displayName("A");
  $("#playerBSinglesButton").textContent = displayName("B");
}

function formatPlayerButtonLabel(label) {
  const text = String(label || "");
  const role = text.endsWith("後衛") ? "後衛" : text.endsWith("前衛") ? "前衛" : "";
  if (!role) return escapeHtml(text);
  const prefix = text.slice(0, -role.length) || role;
  if (prefix === role) return `<span class="player-word">${escapeHtml(role)}</span>`;
  return `<span class="player-word">${escapeHtml(prefix)}</span><span class="player-word">${escapeHtml(role)}</span>`;
}

function getNextStepText() {
  if (state.finished) return "試合終了。分析で要点、履歴で1点ずつ確認できます";
  if (!state.points.length) return `最初は ${displayName(state.server)} のサービス`;
  const latest = state.points[state.points.length - 1];
  return `次は ${displayName(state.server)} のサービス`;
}

function getActiveTab() {
  return $(".tab.active")?.dataset.tab || "record";
}

function renderTrialGuide() {
  const guide = TRIAL_GUIDES[getActiveTab()] || TRIAL_GUIDES.record;
  elements.trialGuideSummary.textContent = guide.summary;
  elements.trialGuideLead.textContent = guide.lead;
  elements.trialGuideList.innerHTML = guide.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderScreenGuide() {
  const tab = getActiveTab();
  if (tab !== "record") {
    elements.startGuide.hidden = true;
    renderTrialGuide();
    return;
  }
  elements.startGuide.hidden = false;
  const matchPointTeams = getMatchPointTeams();
  if (matchPointTeams.length) {
    elements.nextStep.textContent = `マッチポイント: ${matchPointTeams.map(displayName).join("・")}`;
  elements.screenGuide.textContent = "次の1ポイントで試合が決まります。サービス・内容・得点側を確認";
  renderTrialGuide();
  return;
}
elements.nextStep.textContent = getNextStepText();
elements.screenGuide.textContent = "ポイント後に、サービス・内容・プレイヤー・得点側を確認";
renderTrialGuide();
}

function getRuleNoteText() {
  if (state.finished) return "試合終了。分析と履歴でふり返れます。";
  if (!isFinalGame()) return "";

  const total = state.gamePoints.A + state.gamePoints.B;
  const sideChange = total === 2 || (total > 2 && (total - 2) % 4 === 0);
  if (sideChange && total > 0) {
    return "ファイナルゲーム中です。ここでチェンジサイズを確認してください。サービスは2ポイントごとに交替します。";
  }
  return "ファイナルゲーム中です。7ポイント先取、2ポイント差。サービスは2ポイントごとに交替します。";
}

function summarize() {
  const total = state.points.length || 1;
  const ownPoints = state.points.filter((point) => point.winner === "A").length;
  const servePoints = state.points.filter((point) => point.server === "A");
  const firstServeStarts = servePoints.filter((point) => point.serveStart === "第1サービスで開始").length;
  const secondServeStarts = servePoints.filter((point) => point.serveStart === "第2サービスで開始").length;
  const avgRally = state.points.reduce((sum, point) => sum + rallyValue(point.rally), 0) / total;
  const ownLost = state.points.filter((point) => point.winner === "B");
  const ownScoredByPattern = state.points.filter((point) => point.winner === "A" && isScoringOutcome(point.outcome)).length;
  const ownEarlyLost = ownLost.filter(isOpeningPointLoss).length;
  const ownDoubleFaults = ownLost.filter((point) => point.outcome === "ダブルフォールト" && point.server === "A").length;
  const ownReceiveMisses = ownLost.filter((point) => point.outcome === "レシーブミス" && point.server === "B").length;
  const firstHalf = getFirstHalfGames();

  return [
    ["記録したポイント", state.points.length],
    ["取れたポイントの割合", `${Math.round((ownPoints / total) * 100)}%`],
    ["前半のゲーム", `${firstHalf.A}-${firstHalf.B}`],
    ["得点パターン", ownScoredByPattern],
    ["最初の2本で落とした点", ownEarlyLost],
    ["ダブルフォールト", ownDoubleFaults],
    ["第2サービスから始まった点", secondServeStarts],
    ["レシーブミス", ownReceiveMisses],
    ["第1サービスで始められた割合", servePoints.length ? `${Math.round((firstServeStarts / servePoints.length) * 100)}%` : "-"],
    ["平均ラリー本数", avgRally.toFixed(1)]
  ];
}

function getAnalysisData() {
  const total = state.points.length;
  const ownWon = state.points.filter((point) => point.winner === "A");
  const ownPoints = ownWon.length;
  const ownLost = state.points.filter((point) => point.winner === "B");
  const ownScoredByPattern = ownWon.filter((point) => isScoringOutcome(point.outcome)).length;
  const ownPointsByOpponentError = ownWon.filter((point) => isErrorOutcome(point.outcome)).length;
  const ownLostByOwnError = ownLost.filter((point) => isErrorOutcome(point.outcome)).length;
  const servePoints = state.points.filter((point) => point.server === "A");
  const firstServeStarts = servePoints.filter((point) => point.serveStart === "第1サービスで開始").length;
  const secondServeStarts = servePoints.filter((point) => point.serveStart === "第2サービスで開始").length;
  const ownDoubleFaults = ownLost.filter((point) => point.outcome === "ダブルフォールト" && point.server === "A").length;
  const ownReceiveMisses = ownLost.filter((point) => point.outcome === "レシーブミス" && point.server === "B").length;
  const ownEarlyLost = ownLost.filter(isOpeningPointLoss).length;
  return {
    total,
    ownPoints,
    ownScoredByPattern,
    ownPointsByOpponentError,
    ownLostByOwnError,
    ownLost: ownLost.length,
    pointDiff: ownPoints - ownLost.length,
    pointRate: total ? Math.round((ownPoints / total) * 100) : 0,
    firstServeRate: servePoints.length ? Math.round((firstServeStarts / servePoints.length) * 100) : null,
    secondServeStarts,
    ownDoubleFaults,
    ownReceiveMisses,
    ownEarlyLost,
    topError: topEntry(countByOutcomeType("error", ownLost)),
    topScore: topEntry(countByOutcomeType("score", ownWon)),
    topResult: topEntry(countBy("result")),
    topPlayer: topEntry(countByPlayer())
  };
}

function topEntry(counts) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0] || ["なし", 0];
}

function formatPointDiff(diff) {
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return String(diff);
  return "±0";
}

function pointDiffTone(diff) {
  if (diff > 0) return "own";
  if (diff < 0) return "opp";
  return "neutral";
}

function renderAnalysisSummary() {
  const data = getAnalysisData();
  elements.analysisSummary.innerHTML = [
    ["ポイント差", formatPointDiff(data.pointDiff), pointDiffTone(data.pointDiff)],
    ["得点パターン", data.ownScoredByPattern, "own"],
    ["相手ミス得点", data.ownPointsByOpponentError, "own"],
    ["ミス失点", data.ownLostByOwnError, "opp"]
  ].map(([label, value, tone]) => `
    <article class="metric-${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `).join("");
}

function renderScoreQuality() {
  const data = getAnalysisData();
  const totalWon = data.ownPoints || 1;
  const attackRate = Math.round((data.ownScoredByPattern / totalWon) * 100);
  const errorRate = Math.round((data.ownPointsByOpponentError / totalWon) * 100);
  let label = "得点タイプ: バランス型";
  let text = "得点パターンと相手ミス得点が混ざった試合です。";

  if (data.ownPoints === 0) {
    label = "得点タイプ: 未判定";
    text = `${ownSideLabel()}の得点がまだありません。`;
  } else if (attackRate >= 60) {
    label = "得点タイプ: 攻撃型";
    text = `${ownSideLabel()}の得点パターンが多い試合です。再現したい形を確認しましょう。`;
  } else if (errorRate >= 60) {
    label = "得点タイプ: 相手ミス誘発型";
    text = "相手のミスによる得点が多い試合です。どの配球でミスを誘えたか確認しましょう。";
  }

  elements.scoreQuality.innerHTML = `
    <strong>${escapeHtml(label)}</strong>
    <p>${escapeHtml(text)}</p>
    <div class="quality-grid">
      <span>${escapeHtml(ownSideLabel())}の得点 ${data.ownScoredByPattern}</span>
      <span>相手のミス ${data.ownPointsByOpponentError}</span>
    </div>
  `;
}

function buildQuickCoachItems(data = getAnalysisData()) {
  if (!data.total) return ["まだ記録がありません。まずは1ポイント記録してください。"];
  const notes = [];
  if (data.ownDoubleFaults > 0) notes.push(`第2サービスは安全優先。ダブルフォールトを止める。`);
  if (data.ownReceiveMisses > 0) notes.push(`レシーブはまず返す。強打より深く入れる。`);
  if (data.ownEarlyLost >= 3) notes.push(`最初の2本は返球優先。入りで簡単に落とさない。`);
  if (data.firstServeRate !== null && data.firstServeRate < 60) notes.push(`第1サービスは確率重視。入れてから展開する。`);
  if (data.ownScoredByPattern < data.ownPointsByOpponentError) notes.push(`相手ミス得点が多め。自チームで取る形を1つ作る。`);
  if (data.topScore[1] > 0) notes.push(`良い形は「${data.topScore[0]}」。次も同じ形を使う。`);
  if (!notes.length) notes.push("大きな偏りは少なめ。今のリズムを崩さず、先にミスしない。");
  return notes.slice(0, 2);
}

function renderCoachNotes() {
  const data = getAnalysisData();
  if (!data.total) {
    elements.coachNotes.innerHTML = `<strong>今すぐ意識すること</strong><p>まだ記録がありません。まずは1ポイント記録してください。</p>`;
    return;
  }

  const notes = buildQuickCoachItems(data);
  elements.coachNotes.innerHTML = `<strong>今すぐ意識すること</strong><ul>${notes.map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
}

function renderOpponentView() {
  const priorityItems = buildPriorityItems();

  elements.opponentView.innerHTML = `
    <strong>あとで確認すること</strong>
    <ul>${priorityItems.map((item, index) => `<li><b>${index + 1}</b> ${escapeHtml(item)}</li>`).join("")}</ul>
  `;
}

function buildPriorityItems() {
  if (!state.points.length) return ["まだ記録がありません。まずは数ポイント記録して傾向を確認"];

  const ownLost = state.points.filter((point) => point.winner === "B");
  const ownWon = state.points.filter((point) => point.winner === "A");
  const opponentServePoints = state.points.filter((point) => point.server === "B");
  const opponentFirstServe = opponentServePoints.filter((point) => point.serveStart === "第1サービスで開始").length;
  const opponentReceiveMissGain = state.points.filter((point) => point.winner === "B" && point.outcome === "レシーブミス" && point.server === "B").length;
  const opponentByPattern = ownLost.filter((point) => isScoringOutcome(point.outcome)).length;
  const ownError = topEntry(countByOutcomeType("error", ownLost));
  const opponentError = topEntry(countByOutcomeType("error", ownWon));
  const targetPlayer = topEntry(countByPlayer(ownWon.filter((point) => isErrorOutcome(point.outcome))));
  const phaseCounts = getPhaseCounts();
  const firstServeRate = opponentServePoints.length ? Math.round((opponentFirstServe / opponentServePoints.length) * 100) : null;
  const items = [];

  if (ownError[1] > 0) {
    items.push(`失点で最も多いのは「${ownError[0]}」 ${ownError[1]}本`);
  }
  if (phaseCounts["最初の2本で失点"] > 0) {
    items.push(`最初の2本での失点 ${phaseCounts["最初の2本で失点"]}本。ゲームの入りで落としている`);
  }
  if (phaseCounts["ゲームポイント付近で失点"] > 0 || phaseCounts["デュース以降で失点"] > 0) {
    items.push(`勝負所の失点 ${phaseCounts["ゲームポイント付近で失点"] + phaseCounts["デュース以降で失点"]}本。終盤の判断材料`);
  }
  if (opponentError[1] > 0) {
    const target = targetPlayer[1] > 0 && targetPlayer[0] !== "不明" ? ` 対象は ${targetPlayer[0]} が最多` : "";
    items.push(`相手の主なミスは「${opponentError[0]}」 ${opponentError[1]}本。${target}`);
  }
  if (opponentReceiveMissGain > 0) {
    items.push(`相手サービス時のレシーブミス献上 ${opponentReceiveMissGain}本`);
  } else if (firstServeRate !== null && firstServeRate < 60) {
    items.push(`相手の第1サービス開始率 ${firstServeRate}%`);
  }
  if (opponentByPattern > 0) {
    items.push(`相手に取り切られた点 ${opponentByPattern}本`);
  }
  if (!items.length) items.push("大きな偏りはまだ見えていません。記録を続けて傾向確認");

  return items.map(cleanPriorityText).slice(0, 4);
}

function cleanPriorityText(text) {
  return String(text).replace(/[。．.]+$/u, "").replace(/。 +/g, "。").trim();
}

function buildSummaryComments(data = getAnalysisData()) {
  if (!data.total) return ["まだ記録が少ないため、数ポイント記録して傾向を見る"];
  const comments = [];
  const wonTotal = data.ownPoints || 1;
  const attackRate = Math.round((data.ownScoredByPattern / wonTotal) * 100);
  const opponentErrorRate = Math.round((data.ownPointsByOpponentError / wonTotal) * 100);

  if (data.pointDiff > 0) {
    comments.push(`合計ポイントは${formatPointDiff(data.pointDiff)}。ゲーム結果だけでなく内容でも押せている`);
  } else if (data.pointDiff < 0) {
    comments.push(`合計ポイントは${formatPointDiff(data.pointDiff)}。ゲーム前半や簡単な失点を減らす余地がある`);
  } else {
    comments.push(`合計ポイントは${formatPointDiff(data.pointDiff)}。勝敗に関係なく内容は接戦`);
  }

  if (data.ownLostByOwnError > data.ownScoredByPattern) {
    comments.push(`ミス失点${data.ownLostByOwnError}本が得点パターン${data.ownScoredByPattern}本を上回る。まず失点を減らす`);
  } else if (attackRate >= 60) {
    comments.push(`得点の${attackRate}%が自チームの得点パターン。良い形を次の試合でも再現したい`);
  } else if (opponentErrorRate >= 60) {
    comments.push(`得点の${opponentErrorRate}%が相手ミス。相手が崩れた配球や狙い所を確認したい`);
  }

  if (data.ownDoubleFaults > 0 || data.ownReceiveMisses > 0) {
    comments.push(`DF${data.ownDoubleFaults}本、レシーブミス${data.ownReceiveMisses}本。サービス・レシーブの入りを優先`);
  }
  if (data.ownEarlyLost >= 3) {
    comments.push(`最初の2本での失点が${data.ownEarlyLost}本。1本目、2本目は返球優先`);
  }
  if (data.topScore[1] > 0) {
    comments.push(`主な得点は「${data.topScore[0]}」${data.topScore[1]}本。練習でも同じ形を確認`);
  }

  return comments.map(cleanPriorityText).slice(0, 5);
}

function rallyValue(rally) {
  if (rally === "6-9") return 7.5;
  if (rally === "10+") return 10;
  return Number(rally || 0);
}

function getFirstHalfGames() {
  const maxGames = state.gamesToWin * 2 - 1;
  const firstHalfLimit = Math.floor(maxGames / 2);
  return state.points.reduce((acc, point) => {
    if (point.gameWonBy && point.gameNumber <= firstHalfLimit) {
      acc[point.gameWonBy] += 1;
    }
    return acc;
  }, { A: 0, B: 0 });
}

function countBy(key, points = state.points) {
  return points.reduce((acc, point) => {
    const value = point[key] || "未設定";
    if (value === "未記録" || value === "不明") return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function isScoringOutcome(outcome) {
  return SCORING_OUTCOMES.includes(outcome);
}

function isErrorOutcome(outcome) {
  return ERROR_OUTCOMES.includes(outcome);
}

function inferResult(outcome) {
  if (outcome === "ダブルフォールト" || String(outcome).includes("ミス")) return "不明";
  return "イン";
}

function inferResultFromCourse(course, presetResult = "") {
  const value = String(course || "");
  if (presetResult === "ネット" || value === "ネット") return "ネット";
  if (presetResult === "サイドアウト" || value.includes("サイドアウト")) return "サイドアウト";
  if (presetResult === "バックアウト" || value.includes("バックアウト")) return "バックアウト";
  return "イン";
}

function countByOutcomeType(type, points = state.points) {
  const outcomes = type === "score" ? SCORING_OUTCOMES : ERROR_OUTCOMES;
  return points.reduce((acc, point) => {
    if (!outcomes.includes(point.outcome)) return acc;
    acc[point.outcome] = (acc[point.outcome] || 0) + 1;
    return acc;
  }, {});
}

function applyOutcomePreset(outcome) {
  const shotByOutcome = {
    "ダブルフォールト": "サービス",
    "サービス得点": "サービス",
    "レシーブ得点": "レシーブ",
    "レシーブミス": "レシーブ",
    "ボレーミス": "ボレー",
    "ボレー得点": "ボレー",
    "スマッシュミス": "スマッシュ",
    "スマッシュ得点": "スマッシュ",
    "ストロークミス": "ストローク",
    "ストローク得点": "ストローク",
    "ロビング得点": "ロビング"
  };
  if (shotByOutcome[outcome]) {
    elements.shotSelect.value = shotByOutcome[outcome];
  }
  if (outcome === "ダブルフォールト") {
    state.selectedServe = "ダブルフォールト";
    state.selectedCourse = "未記録";
    state.selectedResult = "不明";
    return;
  }
  if (isScoringOutcome(outcome)) {
    state.selectedResult = state.selectedCourse === "未記録" ? "不明" : "イン";
  } else if (state.selectedResult === "イン") {
    state.selectedResult = "ネット";
  }
}

function getPhaseCounts() {
  const ownLost = state.points.filter((point) => point.winner === "B");
  return {
    "最初の2本で失点": ownLost.filter(isOpeningPointLoss).length,
    "ゲームポイント付近で失点": ownLost.filter(isGamePointAreaLoss).length,
    "デュース以降で失点": ownLost.filter(isDeuceOrLaterLoss).length,
    "サービス/レシーブ失点": ownLost.filter((point) => ["ダブルフォールト", "レシーブミス"].includes(point.outcome)).length
  };
}

function countByPlayer(points = state.points) {
  return points.reduce((acc, point) => {
    const label = playerLabel(point.player);
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});
}

function playerSortOrder(label) {
  const labels =
    state.matchType === "singles"
      ? [displayName("A"), displayName("B")]
      : [playerLabel("A後衛"), playerLabel("A前衛"), playerLabel("B後衛"), playerLabel("B前衛")];
  const index = labels.indexOf(label);
  return index === -1 ? 99 : index;
}

function getPlayerPlusMinus() {
  const counts = {};
  state.points.forEach((point) => {
    const label = playerLabel(point.player);
    if (!label || label === "不明" || label === "未設定" || label === "未記録") return;
    counts[label] = counts[label] || { plus: 0, minus: 0 };
    if (isScoringOutcome(point.outcome)) counts[label].plus += 1;
    if (isErrorOutcome(point.outcome)) counts[label].minus += 1;
  });

  return Object.entries(counts)
    .map(([label, value]) => ({ label, plus: value.plus, minus: value.minus, diff: value.plus - value.minus }))
    .filter((item) => item.plus > 0 || item.minus > 0)
    .sort((a, b) => playerSortOrder(a.label) - playerSortOrder(b.label) || b.plus + b.minus - (a.plus + a.minus));
}

function getTopPlayerPlusMinusLabel() {
  const entries = getPlayerPlusMinus();
  if (!entries.length) return "未記録";
  const top = [...entries].sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff) || b.plus + b.minus - (a.plus + a.minus))[0];
  return `${top.label} +${top.plus} / -${top.minus} / ${formatPointDiff(top.diff)}`;
}

function renderStats() {
  const ownWon = state.points.filter((point) => point.winner === "A");
  const ownLost = state.points.filter((point) => point.winner === "B");
  renderAnalysisSummary();
  renderScoreQuality();
  renderCoachNotes();
  renderOpponentView();
  elements.statsGrid.innerHTML = summarize()
    .map(([label, value]) => `<article class="stat"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`)
    .join("");

  renderBars(elements.phaseBars, getPhaseCounts(), "opp");
  renderBars(elements.scoringBars, countByOutcomeType("score", ownWon), "own");
  renderBars(elements.opponentErrorBars, countByOutcomeType("error", ownWon), "opp");
  renderBars(elements.errorBars, countByOutcomeType("error", ownLost), "own");
  renderBars(elements.resultBars, countBy("result"));
  renderBars(elements.handBars, countBy("hand", ownLost));
  renderPlayerPlusMinus();
  renderBars(elements.courseBars, countBy("course"));
  renderAnalysisMemos();
}

function saveAnalysisMemo() {
  const quickItems = buildQuickCoachItems();
  const reviewItems = buildPriorityItems();
  const memo = {
    at: new Date().toISOString(),
    pointCount: state.points.length,
    games: { ...state.games },
    points: { ...state.gamePoints },
    quickItems,
    reviewItems,
    items: [...quickItems, ...reviewItems]
  };
  state.analysisMemos = [memo, ...(state.analysisMemos || [])].slice(0, 12);
  saveState();
  renderAnalysisMemos();
}

function renderAnalysisMemos() {
  const memos = state.analysisMemos || [];
  elements.analysisMemoList.innerHTML = memos.length
    ? memos.map((memo) => {
        const date = new Date(memo.at);
        const time = Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
        const score = `G ${memo.games?.A ?? 0}-${memo.games?.B ?? 0} / P ${memo.points?.A ?? 0}-${memo.points?.B ?? 0}`;
        const quickItems = memo.quickItems || [];
        const reviewItems = memo.reviewItems || memo.items || [];
        const quickHtml = quickItems.length ? `<p>今すぐ意識すること</p><ul>${quickItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
        const reviewHtml = reviewItems.length ? `<p>あとで確認すること</p><ul>${reviewItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : "";
        return `<article><strong>${escapeHtml(time)} ${escapeHtml(score)} ${escapeHtml(memo.pointCount)}点時点</strong>${quickHtml}${reviewHtml}</article>`;
      }).join("")
    : `<p>保存した分析はまだありません。</p>`;
}

function renderBars(container, counts, side = "") {
  const entries = Object.entries(counts).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((entry) => entry[1]));
  container.innerHTML = entries.length
    ? entries.map(([label, value]) => {
        const width = Math.max(8, Math.round((value / max) * 100));
        return `<div class="bar-row ${escapeHtml(side)}"><span>${escapeHtml(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${width}%"></div></div><b>${escapeHtml(value)}</b></div>`;
      }).join("")
    : `<p class="empty">まだ記録がありません</p>`;
}

function renderPlayerPlusMinus() {
  const entries = getPlayerPlusMinus();
  elements.playerBars.innerHTML = entries.length
    ? entries.map((item) => {
        const tone = item.diff > 0 ? "own" : item.diff < 0 ? "opp" : "neutral";
        return `
          <div class="pm-row ${tone}">
            <span>${escapeHtml(item.label)}</span>
            <b class="plus">+${escapeHtml(item.plus)}</b>
            <b class="minus">-${escapeHtml(item.minus)}</b>
            <strong>${escapeHtml(formatPointDiff(item.diff))}</strong>
          </div>
        `;
      }).join("")
    : `<p class="empty">得点またはミスを、プレイヤー付きで記録すると表示されます</p>`;
}

function historyFilterLabel(value) {
  return {
    all: "すべて",
    own: "自チーム得点",
    opp: "相手得点",
    errors: "ミスだけ",
    late: "ゲーム終盤"
  }[value] || "すべて";
}

function isLateGamePoint(point) {
  return point.phase === "ゲーム終盤" || isGamePointAreaLoss(point) || isDeuceOrLaterLoss(point);
}

function filterHistoryPoints(points) {
  const filter = elements.historyFilterSelect?.value || "all";
  if (filter === "own") return points.filter((point) => point.winner === "A");
  if (filter === "opp") return points.filter((point) => point.winner === "B");
  if (filter === "errors") return points.filter((point) => isErrorOutcome(point.outcome));
  if (filter === "late") return points.filter(isLateGamePoint);
  return points;
}

function historyPhaseLabel(point) {
  if (isDeuceOrLaterLoss(point)) return "デュース以降";
  if (isGamePointAreaLoss(point)) return "ゲームポイント付近";
  return point.phase || "場面不明";
}

function historyGameNumber(point) {
  if (point.gameNumber) return point.gameNumber;
  const games = point.scoreBefore?.games || { A: 0, B: 0 };
  return (games.A || 0) + (games.B || 0) + 1;
}

function historyGameLabel(gameNumber) {
  return state.matchFormat === "final" ? "FG" : `${gameNumber}G`;
}

function renderHistoryPoint(point) {
  const number = state.points.indexOf(point) + 1;
  const beforeGames = point.scoreBefore?.games || { A: 0, B: 0 };
  const beforePoints = point.scoreBefore?.points || { A: 0, B: 0 };
  const before = `G ${beforeGames.A}-${beforeGames.B} / P ${beforePoints.A}-${beforePoints.B}`;
  const afterGames = point.scoreAfter?.games || beforeGames;
  const afterPoints = point.scoreAfter?.points || beforePoints;
  const after = `G ${afterGames.A}-${afterGames.B} / P ${afterPoints.A}-${afterPoints.B}`;
  const winner = `${displayName(point.winner)}の得点`;
  const actor = playerLabel(point.player);
  const location = [point.course, point.result && point.result !== "イン" ? point.result : ""].filter(Boolean).join(" / ");
  const service = `${point.serveStart || "サービス不明"} / S ${shortSideName(point.server)}`;
  const meta = [location, historyPhaseLabel(point), service, point.memo].filter(Boolean).join("・");
  const sideClass = point.winner === "A" ? "own" : "opp";
  return `
    <li class="history-item ${sideClass}">
      <div class="history-head">
        <span class="history-number">${escapeHtml(number)}点目</span>
        <strong>${escapeHtml(winner)}</strong>
      </div>
      <div class="history-body">
        <span class="history-main">${escapeHtml(point.outcome)}</span>
        <span class="history-player">${escapeHtml(actor)}</span>
        <span class="history-score">${escapeHtml(before)} → ${escapeHtml(after)}</span>
      </div>
      <small>${escapeHtml(meta)}</small>
    </li>
  `;
}

function renderHistoryGameGroup(points, index) {
  const gameNumber = historyGameNumber(points[0]);
  const originalOrder = points.slice().sort((a, b) => state.points.indexOf(a) - state.points.indexOf(b));
  const lastPoint = originalOrder[originalOrder.length - 1];
  const gameWinner = originalOrder.find((point) => point.gameWonBy)?.gameWonBy;
  const afterPoints = lastPoint?.scoreAfter?.points || { A: 0, B: 0 };
  const status = gameWinner ? `${shortSideName(gameWinner)}が取得` : `P ${afterPoints.A}-${afterPoints.B}`;
  return `
    <li class="history-game">
      <details ${index === 0 ? "open" : ""}>
        <summary>
          <strong>${escapeHtml(historyGameLabel(gameNumber))}</strong>
          <span>${escapeHtml(status)} / ${escapeHtml(points.length)}点</span>
        </summary>
        <ol class="history-game-list">
          ${points.map(renderHistoryPoint).join("")}
        </ol>
      </details>
    </li>
  `;
}

function renderHistory() {
  const info = state.matchInfo || defaultState.matchInfo;
  const date = info.date || "日付未記録";
  const time = getMatchTimeRange(info);
  elements.historyDateLabel.textContent = time ? `${date} / ${time}` : date;
  const filteredPoints = filterHistoryPoints(state.points);
  const filter = elements.historyFilterSelect?.value || "all";
  if (!filteredPoints.length) {
    elements.pointList.innerHTML = `<li class="history-empty">${escapeHtml(historyFilterLabel(filter))}に当てはまる履歴はまだありません</li>`;
    return;
  }

  const orderedPoints = filteredPoints.slice();
  if ((elements.historySortSelect?.value || "newest") === "newest") {
    orderedPoints.reverse();
  }

  const groups = orderedPoints.reduce((acc, point) => {
    const gameNumber = historyGameNumber(point);
    const current = acc[acc.length - 1];
    if (!current || current.gameNumber !== gameNumber) {
      acc.push({ gameNumber, points: [point] });
    } else {
      current.points.push(point);
    }
    return acc;
  }, []);

  elements.pointList.innerHTML = groups.map((group, index) => renderHistoryGameGroup(group.points, index)).join("");
}

function render() {
  renderScore();
  renderStats();
  renderHistory();
}

function exportCsv() {
  const rows = [
    ["No", "日付", "時間帯", "開始時刻", "終了時刻", "天気", "気温", "風", "風向き", "コート種別", "コート状態", "種別", "相手基本布陣", "区分", "大会名", "開催地／会場", "コート", "試合形式", "得点側", "サービスサイド", "ゲーム", "ポイント", "場面", "サービスの入り方", "ポイント内容", "ボールの結果", "誰のプレー", "ショット", "打球面", "コース", "ラリー数", "ゲーム取得", "メモ", "記録時刻"],
    ...state.points.map((point, index) => [
      index + 1,
      state.matchInfo.date,
      state.matchInfo.timeOfDay,
      state.matchInfo.startTime,
      state.matchInfo.endTime,
      state.matchInfo.weather,
      state.matchInfo.temperature,
      state.matchInfo.wind,
      state.matchInfo.windSide,
      state.matchInfo.surface,
      state.matchInfo.courtCondition,
      state.matchType === "singles" ? "シングルス" : "ダブルス",
      state.matchInfo.opponentFormation,
      state.matchInfo.event,
      state.matchInfo.tournament,
      state.matchInfo.venueName,
      state.matchInfo.venue,
      matchFormatLabel(),
      displayName(point.winner),
      displayName(point.server),
      `${point.scoreBefore.games.A}-${point.scoreBefore.games.B}`,
      `${point.scoreBefore.points.A}-${point.scoreBefore.points.B}`,
      point.phase,
      point.serveStart,
      point.outcome,
      point.result,
      playerLabel(point.player),
      point.shot,
      point.hand,
      point.course,
      point.rally,
      point.gameWonBy ? displayName(point.gameWonBy) : "",
      point.memo,
      point.at
    ])
  ];
  const csv = rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `soft-tennis-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function getGamePointScoreRows() {
  const rows = [];
  const byGame = state.points.reduce((acc, point) => {
    const gameNumber = point.gameNumber || getGameNumber(point.scoreBefore?.games || { A: 0, B: 0 });
    if (!acc.has(gameNumber)) acc.set(gameNumber, []);
    acc.get(gameNumber).push(point);
    return acc;
  }, new Map());

  [...byGame.entries()].sort((a, b) => a[0] - b[0]).forEach(([gameNumber, points]) => {
    const last = points[points.length - 1];
    const before = last.scoreBefore?.points || { A: 0, B: 0 };
    const finalPoints = { A: before.A || 0, B: before.B || 0 };
    finalPoints[last.winner] += 1;
    rows.push([gameNumberLabel(gameNumber), `${finalPoints.A}-${finalPoints.B}`]);
  });

  const currentGameNumber = getGameNumber(state.games);
  if (!state.finished && !byGame.has(currentGameNumber)) {
    rows.push([gameNumberLabel(currentGameNumber), `${state.gamePoints.A}-${state.gamePoints.B}`]);
  }

  return rows.length ? rows : [[gameNumberLabel(currentGameNumber), "0-0"]];
}

function gameNumberLabel(gameNumber) {
  return state.matchFormat === "final" ? "FG" : `${gameNumber}G`;
}

function getCurrentTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  if (hour < 5) return "夜";
  if (hour < 9) return "朝";
  if (hour < 12) return "午前";
  if (hour < 13) return "昼";
  if (hour < 17) return "午後";
  if (hour < 19) return "夕方";
  return "夜";
}

function getCurrentClockTime(date = new Date()) {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getMatchTimeRange(info = state.matchInfo || defaultState.matchInfo) {
  const start = info.startTime || "";
  const end = info.endTime || "";
  if (start && end) return `${start}-${end}`;
  if (start) return `${start}開始`;
  if (end) return `${end}終了`;
  return "";
}

function getSummaryImageData() {
  const data = getAnalysisData();
  const phaseCounts = getPhaseCounts();
  const info = state.matchInfo || defaultState.matchInfo;
  const typeLabel = state.matchType === "singles" ? "シングルス" : "ダブルス";
  const opponentError = topEntry(countByOutcomeType("error", state.points.filter((point) => point.winner === "A")));
  const latestMemo = (state.analysisMemos || [])[0];
  const latestMemoDate = latestMemo ? new Date(latestMemo.at) : null;
  const latestMemoTime =
    latestMemoDate && !Number.isNaN(latestMemoDate.getTime())
      ? `${String(latestMemoDate.getHours()).padStart(2, "0")}:${String(latestMemoDate.getMinutes()).padStart(2, "0")}`
      : "";
  const latestMemoScore = latestMemo
    ? `G ${latestMemo.games?.A ?? 0}-${latestMemo.games?.B ?? 0} / P ${latestMemo.points?.A ?? 0}-${latestMemo.points?.B ?? 0}`
    : "";
  const winner = getWinnerTeam();
  const matchResultLabel = state.finished
    ? winner
      ? `WINNER ${displayName(winner)}`
      : "試合終了"
    : "試合中";
  const weather = [info.weather, info.temperature ? `${info.temperature}℃` : "", info.wind !== "未記録" ? `風:${info.wind}` : ""]
    .filter(Boolean)
    .filter((item) => item !== "未記録")
    .join(" / ");
  const court = [info.surface !== "未記録" ? info.surface : "", info.courtCondition !== "未記録" ? info.courtCondition : ""].filter(Boolean).join(" / ");
  const tournament = info.tournament && info.tournament !== "未記録" ? info.tournament : "";
  const venueName = info.venueName && info.venueName !== "未記録" ? info.venueName : "";
  const timeRange = getMatchTimeRange(info);
  const conditionRows = [
    ["日時", [info.date || "日付未記録", info.timeOfDay !== "未記録" ? info.timeOfDay : "", timeRange].filter(Boolean).join(" / ")],
    ["大会名", tournament || "未記録"],
    ["開催地／会場", venueName || "未記録"],
    ["区分", info.event && info.event !== "未記録" ? info.event : "未記録"],
    ["天候・気温", [info.weather !== "未記録" ? info.weather : "", info.temperature ? `${info.temperature}℃` : ""].filter(Boolean).join(" / ") || "未記録"],
    ["風", info.wind !== "未記録" ? info.wind : "未記録"],
    ["コート", [info.venue && info.venue !== "未記録" ? info.venue : "", court].filter(Boolean).join(" / ") || "未記録"],
    ["相手布陣", state.matchType === "singles" ? "シングルス" : info.opponentFormation || "不明"]
  ];

  return {
    title: "ソフトテニス試合ノート",
    subtitle: `${typeLabel} / ${matchFormatLabel()}`,
    teams: `${displayName("A")}  vs  ${displayName("B")}`,
    gameScore: `${state.games.A}-${state.games.B}`,
    currentPointScore: state.finished ? "終了" : `${pointLabel("A")}-${pointLabel("B")}`,
    gameScoreRows: getGamePointScoreRows(),
    conditionRows,
    meta: [
      info.date || "日付未記録",
      info.timeOfDay !== "未記録" ? info.timeOfDay : "",
      timeRange,
      weather,
      court,
      info.event !== "未記録" ? info.event : "",
      tournament,
      venueName,
      info.venue !== "未記録" ? info.venue : ""
    ].filter(Boolean),
    summaryRows: [
      ["ポイント差", formatPointDiff(data.pointDiff), pointDiffTone(data.pointDiff)],
      ["記録ポイント", data.total, "neutral"],
      ["得点パターン", data.ownScoredByPattern, "own"],
      ["相手ミス得点", data.ownPointsByOpponentError, "own"],
      ["ミス失点", data.ownLostByOwnError, "opp"],
      ["個人別 + / -", getTopPlayerPlusMinusLabel(), "neutral"]
    ],
    resultRows: [
      ["試合結果", matchResultLabel],
      ["ゲームスコア", state.finished ? `${state.games.A}-${state.games.B}` : `途中 ${state.games.A}-${state.games.B}`],
      ["現在ポイント", state.finished ? "終了" : `${pointLabel("A")}-${pointLabel("B")}`],
      ["各ゲーム", getGamePointScoreRows().slice(0, 9).map(([label, score]) => `${label} ${score}`).join(" / ")]
    ],
    analysisComments: buildSummaryComments(data),
    quickTitle: latestMemo ? `今すぐ意識すること ${[latestMemoTime, latestMemoScore].filter(Boolean).join(" ")}` : "今すぐ意識すること",
    quickItems: latestMemo ? (latestMemo.quickItems || []) : buildQuickCoachItems(data),
    reviewTitle: "あとで確認すること",
    reviewItems: latestMemo ? (latestMemo.reviewItems || latestMemo.items || []) : buildPriorityItems(),
    analysisMemoTitle: latestMemo ? `保存した分析 ${[latestMemoTime, latestMemoScore].filter(Boolean).join(" ")}` : "今すぐ意識すること",
    analysisMemoItems: latestMemo ? [...(latestMemo.quickItems || []), ...(latestMemo.reviewItems || latestMemo.items || [])].slice(0, 4) : [...buildQuickCoachItems(data), ...buildPriorityItems()].slice(0, 4),
    priorityItems: latestMemo ? [...(latestMemo.quickItems || []), ...(latestMemo.reviewItems || latestMemo.items || [])].slice(0, 4) : buildPriorityItems(),
    detailRows: [
      ["主な得点パターン", `${data.topScore[0]} ${data.topScore[1]}`],
      ["相手の主なミス", `${opponentError[0]} ${opponentError[1]}`],
      ["主な失点ミス", `${data.topError[0]} ${data.topError[1]}`],
      ["第1サービス開始率", data.firstServeRate === null ? "-" : `${data.firstServeRate}%`],
      ["ダブルフォールト", data.ownDoubleFaults],
      ["レシーブミス", data.ownReceiveMisses],
      ["最初の2本で失点", data.ownEarlyLost]
    ],
    phaseRows: Object.entries(phaseCounts).filter(([, value]) => value > 0)
  };
}

function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = [...String(text)];
  let line = "";
  let cursorY = y;
  chars.forEach((char) => {
    const nextLine = line + char;
    if (line && ctx.measureText(nextLine).width > maxWidth) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
    } else {
      line = nextLine;
    }
  });
  if (line) ctx.fillText(line, x, cursorY);
  return cursorY + lineHeight;
}

function fitText(ctx, text, maxWidth) {
  const suffix = "...";
  const value = String(text ?? "");
  if (ctx.measureText(value).width <= maxWidth) return value;
  const chars = [...value];
  while (chars.length && ctx.measureText(`${chars.join("")}${suffix}`).width > maxWidth) {
    chars.pop();
  }
  return `${chars.join("")}${suffix}`;
}

function drawClampedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 1) {
  const chars = [...String(text ?? "")];
  const lines = [];
  let line = "";

  for (const char of chars) {
    const nextLine = line + char;
    if (line && ctx.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = char;
      if (lines.length === maxLines) break;
    } else {
      line = nextLine;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (chars.join("") !== lines.join("")) {
    lines[lines.length - 1] = fitText(ctx, lines[lines.length - 1], maxWidth);
  }

  lines.slice(0, maxLines).forEach((lineText, index) => {
    ctx.fillText(lineText, x, y + index * lineHeight);
  });
  return y + lines.length * lineHeight;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
  ctx.fillStyle = fillStyle;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius, strokeStyle, lineWidth = 2) {
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = lineWidth;
  roundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function drawSummaryImage(canvas, summary) {
  const ctx = canvas.getContext("2d");
  const width = 1080;
  const height = 1880;
  const ownColor = "#2563eb";
  const oppColor = "#dc2626";
  const inkColor = "#1f2937";
  const mutedColor = "#64748b";
  const lineColor = "#d9e1ea";
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const textColor = (tone) => (tone === "own" ? ownColor : tone === "opp" ? oppColor : inkColor);
  const drawMd = (text, x, y, options = {}) => {
    const size = options.size || 28;
    const weight = options.weight || 800;
    const lineHeight = options.lineHeight || Math.round(size * 1.45);
    const maxLines = options.maxLines || 1;
    const maxWidth = options.maxWidth || 952;
    ctx.fillStyle = options.color || inkColor;
    ctx.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif`;
    return drawClampedText(ctx, text, x, y, maxWidth, lineHeight, maxLines) + (options.after || 0);
  };
  const bullet = (text, y, tone = "neutral", maxLines = 1) =>
    drawMd(`- ${text}`, 78, y, { size: 27, lineHeight: 36, maxLines, color: textColor(tone), after: 4 });
  const heading = (text, y) => drawMd(`## ${text}`, 64, y, { size: 32, weight: 900, lineHeight: 42, after: 6 });

  let y = 76;
  y = drawMd(`# ${summary.title}`, 56, y, { size: 46, weight: 900, lineHeight: 58, after: 8 });
  y = drawMd(`> ${summary.subtitle}`, 64, y, { size: 27, weight: 800, color: mutedColor, lineHeight: 36, after: 10 });
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(56, y + 4);
  ctx.lineTo(1024, y + 4);
  ctx.stroke();
  y += 42;

  y = heading("基本情報", y);
  y = bullet(summary.teams, y, "neutral", 1);
  summary.conditionRows.slice(0, 2).forEach(([label, value]) => {
    y = bullet(`${label}: ${value}`, y, "neutral", 1);
  });
  y += 10;

  y = heading("試合結果", y);
  summary.resultRows.forEach(([label, value]) => {
    y = bullet(`${label}: ${value}`, y, "neutral", label === "各ゲーム" ? 2 : 1);
  });
  y += 10;

  y = heading("分析コメント", y);
  summary.analysisComments.slice(0, 5).forEach((item) => {
    y = bullet(item, y, "neutral", 2);
  });
  y += 10;

  y = heading("次に活かすこと", y);
  [...summary.quickItems, ...summary.reviewItems].slice(0, 3).forEach((item) => {
    y = bullet(item, y, "neutral", 2);
  });
  y += 8;

  y = heading("根拠データ", y);
  [...summary.summaryRows, ...summary.detailRows, ...summary.phaseRows].slice(0, 9).forEach(([label, value, tone]) => {
    if (label === "記録ポイント") return;
    y = bullet(`${label}: ${value}`, y, "neutral", 1);
  });
  y += 8;

  y = heading("試合条件", y);
  summary.conditionRows.slice(2, 6).forEach(([label, value]) => {
    y = bullet(`${label}: ${value}`, y, "neutral", 1);
  });

  ctx.fillStyle = mutedColor;
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  const footer = ["端末内で画像生成。開発者や管理者へ送られません。", ...summary.meta].join(" / ");
  drawClampedText(ctx, footer, 56, 1794, 968, 32, 2);
}

function createSummaryImageDataUrl() {
  const canvas = document.createElement("canvas");
  drawSummaryImage(canvas, getSummaryImageData());
  return canvas.toDataURL("image/png");
}

function previewSummaryImage() {
  elements.summaryPreviewImage.src = createSummaryImageDataUrl();
  elements.summaryImageDialog.showModal();
}

function downloadSummaryPreview() {
  const dataUrl = elements.summaryPreviewImage.src || createSummaryImageDataUrl();
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `soft-tennis-summary-${new Date().toISOString().slice(0, 10)}.png`;
  link.click();
}

function openMatchDialog(mode = "new") {
  matchDialogMode = mode;
  const info = state.matchInfo || defaultState.matchInfo;
  const isEdit = mode === "edit";
  const startButton = $("#startMatchButton");
  elements.matchDialogTitle.textContent = isEdit ? "試合情報を編集" : "新規試合";
  startButton.textContent = isEdit ? "保存" : "開始";
  startButton.classList.toggle("action-save", isEdit);
  startButton.classList.toggle("action-start", !isEdit);
  elements.matchTypeSelect.value = state.matchType || "doubles";
  elements.dialogTeamA.value = state.teams.A;
  elements.dialogTeamB.value = state.teams.B;
  elements.dialogAFront.value = state.players.AFront;
  elements.dialogARear.value = state.players.ARear;
  elements.dialogBFront.value = state.players.BFront;
  elements.dialogBRear.value = state.players.BRear;
  elements.opponentFormationSelect.value = info.opponentFormation || "雁行陣";
  elements.matchFormatSelect.value = state.matchFormat || matchFormatFromGamesToWin(state.gamesToWin);
  elements.matchDateInput.value = info.date || new Date().toISOString().slice(0, 10);
  elements.matchTimeSelect.value = info.timeOfDay && info.timeOfDay !== "未記録" ? info.timeOfDay : getCurrentTimeOfDay();
  elements.matchStartTimeInput.value = isEdit ? info.startTime || "" : getCurrentClockTime();
  elements.matchEndTimeInput.value = isEdit ? info.endTime || "" : "";
  elements.weatherSelect.value = info.weather || "未記録";
  elements.temperatureInput.value = info.temperature || "";
  elements.windSelect.value = info.wind || "未記録";
  elements.surfaceSelect.value = info.surface || "未記録";
  elements.courtConditionSelect.value = info.courtCondition || "未記録";
  elements.eventInput.value = info.event || "未記録";
  elements.tournamentInput.value = info.tournament || "未記録";
  elements.venueNameInput.value = info.venueName || "未記録";
  elements.venueInput.value = info.venue || "未記録";
  updateMatchTypeFields();
  elements.dialog.showModal();
}

$$(".point-button").forEach((button) => {
  button.addEventListener("click", () => addPoint(button.dataset.winner));
});

$("#undoButton").addEventListener("click", undoPoint);
elements.saveAnalysisMemoButton.addEventListener("click", saveAnalysisMemo);
elements.menuButton.addEventListener("click", () => elements.actionMenuDialog.showModal());
elements.openNewMatchButton.addEventListener("click", () => {
  elements.actionMenuDialog.close();
  openMatchDialog("new");
});
elements.editMatchInfoButton.addEventListener("click", () => {
  elements.actionMenuDialog.close();
  openMatchDialog("edit");
});
elements.previewSummaryImageButton.addEventListener("click", () => {
  elements.actionMenuDialog.close();
  previewSummaryImage();
});
elements.downloadSummaryImageButton.addEventListener("click", downloadSummaryPreview);
elements.exportCsvButton.addEventListener("click", () => {
  elements.actionMenuDialog.close();
  exportCsv();
});
$("#startMatchButton").addEventListener("click", () => {
  if (matchDialogMode === "edit") {
    updateMatchInfo();
  } else {
    newMatch();
  }
});
elements.matchTypeSelect.addEventListener("change", updateMatchTypeFields);

function updateMatchTypeFields() {
  const singles = elements.matchTypeSelect.value === "singles";
  elements.dialogTeamALabel.textContent = singles ? "自分の名前" : "自チーム名";
  elements.dialogTeamBLabel.textContent = singles ? "相手選手名" : "相手名";
  $$(".doubles-field").forEach((field) => {
    field.hidden = singles;
  });

  if (singles && ["自ペア", "自チーム"].includes(elements.dialogTeamA.value)) elements.dialogTeamA.value = "自分";
  if (singles && elements.dialogTeamB.value === "相手ペア") elements.dialogTeamB.value = "相手選手";
  if (!singles && elements.dialogTeamA.value === "自分") elements.dialogTeamA.value = "自チーム";
  if (!singles && elements.dialogTeamB.value === "相手選手") elements.dialogTeamB.value = "相手ペア";
}

elements.teamAName.addEventListener("input", () => {
  state.teams.A = elements.teamAName.value;
  saveState();
  renderScore();
});

elements.teamBName.addEventListener("input", () => {
  state.teams.B = elements.teamBName.value;
  saveState();
  renderScore();
});

elements.historyFilterSelect.addEventListener("change", renderHistory);
elements.historySortSelect.addEventListener("change", renderHistory);

$$(".tab").forEach((button) => {
  button.addEventListener("click", () => {
    $$(".tab").forEach((tab) => tab.classList.toggle("active", tab === button));
    $$(".panel").forEach((panel) => panel.classList.toggle("active", panel.id === `${button.dataset.tab}Panel`));
    renderScreenGuide();
  });
});

$("#serverControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-server]");
  if (!button) return;
  state.server = button.dataset.server;
  saveState();
  renderScore();
});

$("#serveControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-serve]");
  if (!button) return;
  state.selectedServe = button.dataset.serve;
  if (state.selectedServe === "ダブルフォールト") {
    state.selectedOutcome = "ダブルフォールト";
    elements.shotSelect.value = "サービス";
    state.selectedResult = "不明";
  }
  saveState();
  renderScore();
});

$("#outcomeControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-outcome]");
  if (!button) return;
  state.selectedOutcome = button.dataset.outcome;
  applyOutcomePreset(state.selectedOutcome);
  saveState();
  renderScore();
});

$("#resultControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-result]");
  if (!button) return;
  state.selectedResult = button.dataset.result;
  saveState();
  renderScore();
});

$("#handControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-hand]");
  if (!button) return;
  state.selectedHand = button.dataset.hand;
  saveState();
  renderScore();
});

$("#playerControl").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-player]");
  if (!button) return;
  state.selectedPlayer = button.dataset.player;
  saveState();
  renderScore();
});

$(".half-court").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-course]");
  if (!button) return;
  state.selectedCourse = button.dataset.course;
  state.selectedResult = inferResultFromCourse(button.dataset.course, button.dataset.result);
  saveState();
  renderScore();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();
