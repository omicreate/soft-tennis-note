const STORAGE_KEY = "soft-tennis-logger-state-v1";
const SCORING_OUTCOMES = ["ストローク得点", "ボレー得点", "スマッシュ得点", "サービス得点", "レシーブ得点", "ロビング得点"];
const ERROR_OUTCOMES = ["ダブルフォールト", "レシーブミス", "ストロークミス", "ボレーミス", "スマッシュミス", "その他"];

const defaultState = {
  matchType: "doubles",
  teams: { A: "自ペア", B: "相手ペア" },
  players: {
    AFront: "自ペア前衛",
    ARear: "自ペア後衛",
    BFront: "相手前衛",
    BRear: "相手後衛"
  },
  gamesToWin: 4,
  matchFormat: "7",
  matchInfo: {
    date: "",
    timeOfDay: "未記録",
    weather: "未記録",
    temperature: "",
    wind: "未記録",
    windSide: "未記録",
    surface: "未記録",
    courtCondition: "未記録",
    opponentFormation: "不明",
    event: "",
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
  dialog: $("#newMatchDialog"),
  actionMenuDialog: $("#actionMenuDialog"),
  summaryImageDialog: $("#summaryImageDialog"),
  summaryPreviewImage: $("#summaryPreviewImage"),
  menuButton: $("#menuButton"),
  openNewMatchButton: $("#openNewMatchButton"),
  previewSummaryImageButton: $("#previewSummaryImageButton"),
  downloadSummaryImageButton: $("#downloadSummaryImageButton"),
  exportCsvButton: $("#exportCsvButton"),
  matchTypeSelect: $("#matchTypeSelect"),
  dialogTeamA: $("#dialogTeamA"),
  dialogTeamB: $("#dialogTeamB"),
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
  weatherSelect: $("#weatherSelect"),
  temperatureInput: $("#temperatureInput"),
  windSelect: $("#windSelect"),
  windSideSelect: $("#windSideSelect"),
  surfaceSelect: $("#surfaceSelect"),
  courtConditionSelect: $("#courtConditionSelect"),
  eventInput: $("#eventInput"),
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
  if (["自ペア", "自分", "相手", "相手ペア", "相手選手"].includes(name)) return name.replace("選手", "");
  const compact = name.replace(/\s+/g, "").replace(/ペア$/, "").replace(/チーム$/, "");
  return [...compact].slice(0, 4).join("");
}

function ownDefaultName() {
  return state.matchType === "singles" ? "自分" : "自ペア";
}

function opponentDefaultName() {
  return state.matchType === "singles" ? "相手選手" : "相手ペア";
}

function ownSideLabel() {
  return state.matchType === "singles" ? "自分" : "自ペア";
}

function playerLabel(player) {
  const labels = {
    A前衛: state.players.AFront,
    A後衛: state.players.ARear,
    B前衛: state.players.BFront,
    B後衛: state.players.BRear,
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
  state.finished = false;
  saveState();
  render();
}

function newMatch() {
  state = structuredClone(defaultState);
  state.matchType = elements.matchTypeSelect.value;
  state.teams.A = elements.dialogTeamA.value.trim() || ownDefaultName();
  state.teams.B = elements.dialogTeamB.value.trim() || opponentDefaultName();
  state.players.AFront = elements.dialogAFront.value.trim() || "自ペア前衛";
  state.players.ARear = elements.dialogARear.value.trim() || "自ペア後衛";
  state.players.BFront = elements.dialogBFront.value.trim() || "相手前衛";
  state.players.BRear = elements.dialogBRear.value.trim() || "相手後衛";
  state.selectedPlayer = "不明";
  state.analysisMemos = [];
  state.matchFormat = elements.matchFormatSelect.value;
  state.gamesToWin = gamesToWinFromFormat(state.matchFormat);
  state.matchInfo = {
    date: elements.matchDateInput.value,
    timeOfDay: elements.matchTimeSelect.value,
    weather: elements.weatherSelect.value,
    temperature: elements.temperatureInput.value,
    wind: elements.windSelect.value,
    windSide: elements.windSideSelect.value,
    surface: elements.surfaceSelect.value,
    courtCondition: elements.courtConditionSelect.value,
    opponentFormation: state.matchType === "singles" ? "不明" : elements.opponentFormationSelect.value,
    event: elements.eventInput.value,
    venue: elements.venueInput.value
  };
  saveState();
  render();
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
  elements.serverLabel.textContent = `サービスサイド: ${displayName(state.server)}`;
  renderLiveScore();
  renderMatchPointAlert();
  $(".point-button.own").innerHTML = `${escapeHtml(displayName("A"))}<br />1ポイント`;
  $(".point-button.opp").innerHTML = `${escapeHtml(displayName("B"))}<br />1ポイント`;
  renderPlayerButtons();
  renderCourtMode();
  renderMatchInfo();

  if (state.finished) {
    const winner = state.games.A > state.games.B ? "A" : "B";
    elements.matchStatus.textContent = `${displayName(winner)} 勝利`;
  } else if (state.matchFormat === "final") {
    elements.matchStatus.textContent = "ファイナル";
  } else {
    elements.matchStatus.textContent = `第${state.games.A + state.games.B + 1}ゲーム`;
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
  elements.liveServerLabel.textContent = `S: ${shortDisplayName(state.server)}`;
  elements.liveServerLabel.title = `サービスサイド: ${displayName(state.server)}`;
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
  const gameLabel = state.matchFormat === "final" || isFinalGame() ? "ファイナル" : `第${state.games.A + state.games.B + 1}ゲーム`;
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
  return `G${state.games.A + state.games.B + 1}`;
}

function renderMatchInfo() {
  const info = state.matchInfo || defaultState.matchInfo;
  const weather = [info.weather, info.temperature ? `${info.temperature}℃` : "", info.wind !== "未記録" ? `風:${info.wind}` : "", info.windSide !== "未記録" ? info.windSide : ""]
    .filter(Boolean)
    .filter((item) => item !== "未記録")
    .join(" / ");
  const court = [info.surface !== "未記録" ? info.surface : "", info.courtCondition !== "未記録" ? info.courtCondition : ""].filter(Boolean).join(" / ");
  const matchTypeLabel = state.matchType === "singles" ? "シングルス" : "ダブルス";
  const rows = [
    matchTypeLabel,
    matchFormatLabel(),
    info.date,
    info.timeOfDay !== "未記録" ? info.timeOfDay : "",
    weather,
    court,
    state.matchType !== "singles" && info.opponentFormation !== "不明" ? `相手:${info.opponentFormation}` : "",
    info.event !== "未記録" ? info.event : "",
    info.venue !== "未記録" ? info.venue : ""
  ].filter(Boolean);
  elements.matchInfo.textContent = rows.length ? rows.join(" ・ ") : matchFormatLabel();
}

function renderPlayerButtons() {
  const singles = state.matchType === "singles";
  $("#playerAFrontButton").hidden = singles;
  $("#playerARearButton").hidden = singles;
  $("#playerBFrontButton").hidden = singles;
  $("#playerBRearButton").hidden = singles;
  $("#playerASinglesButton").hidden = !singles;
  $("#playerBSinglesButton").hidden = !singles;
  $("#playerAFrontButton").textContent = playerLabel("A前衛");
  $("#playerARearButton").textContent = playerLabel("A後衛");
  $("#playerBFrontButton").textContent = playerLabel("B前衛");
  $("#playerBRearButton").textContent = playerLabel("B後衛");
  $("#playerASinglesButton").textContent = displayName("A");
  $("#playerBSinglesButton").textContent = displayName("B");
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

function renderScreenGuide() {
  const tab = getActiveTab();
  if (tab !== "record") {
    elements.startGuide.hidden = true;
    return;
  }
  elements.startGuide.hidden = false;
  const matchPointTeams = getMatchPointTeams();
  if (matchPointTeams.length) {
    elements.nextStep.textContent = `マッチポイント: ${matchPointTeams.map(displayName).join("・")}`;
    elements.screenGuide.textContent = "次の1ポイントで試合が決まります。サービス、内容、得点側だけ落ち着いて確認";
    return;
  }
  elements.nextStep.textContent = getNextStepText();
  elements.screenGuide.textContent = "ポイント後に、サービスの入り方、内容、誰のプレー、得点側を確認";
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
    [state.matchType === "singles" ? "自分で取った点" : "自分たちで取った点", ownScoredByPattern],
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

function renderAnalysisSummary() {
  const data = getAnalysisData();
  elements.analysisSummary.innerHTML = [
    ["ポイント内訳", `${data.ownPoints}-${data.ownLost}`],
    [state.matchType === "singles" ? "自分で取った点" : "自分たちで取った点", data.ownScoredByPattern],
    ["相手のミスで取った点", data.ownPointsByOpponentError],
    ["ミスで失った点", data.ownLostByOwnError]
  ].map(([label, value]) => `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`).join("");
}

function renderScoreQuality() {
  const data = getAnalysisData();
  const totalWon = data.ownPoints || 1;
  const attackRate = Math.round((data.ownScoredByPattern / totalWon) * 100);
  const errorRate = Math.round((data.ownPointsByOpponentError / totalWon) * 100);
  let label = "得点タイプ: バランス型";
  let text = "自分たちの得点と相手のミスが混ざった試合です。";

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

function renderCoachNotes() {
  const data = getAnalysisData();
  if (!data.total) {
    elements.coachNotes.innerHTML = `<strong>チェンジサイズで一言</strong><p>まだ記録がありません。まずは1ポイント記録してください。</p>`;
    return;
  }

  const notes = [];
  if (data.ownDoubleFaults > 0) notes.push(`第2サービスは安全優先。ダブルフォールトを止める。`);
  if (data.ownReceiveMisses > 0) notes.push(`レシーブはまず返す。強打より深く入れる。`);
  if (data.ownEarlyLost >= 3) notes.push(`最初の2本は返球優先。入りで簡単に落とさない。`);
  if (data.firstServeRate !== null && data.firstServeRate < 60) notes.push(`第1サービスは確率重視。入れてから展開する。`);
  if (data.ownScoredByPattern < data.ownPointsByOpponentError) notes.push(`もらった点が多め。自分たちから取る形を1つ作る。`);
  if (data.topScore[1] > 0) notes.push(`良い形は「${data.topScore[0]}」。次も同じ形を使う。`);
  if (!notes.length) notes.push("大きな偏りは少なめ。今のリズムを崩さず、先にミスしない。");

  elements.coachNotes.innerHTML = `<strong>チェンジサイズで一言</strong><ul>${notes.slice(0, 2).map((note) => `<li>${escapeHtml(note)}</li>`).join("")}</ul>`;
}

function renderOpponentView() {
  const priorityItems = buildPriorityItems();

  elements.opponentView.innerHTML = `
    <strong>優先度順メモ</strong>
    <ul>${priorityItems.map((item, index) => `<li><b>P${index + 1}</b> ${escapeHtml(item)}</li>`).join("")}</ul>
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
  renderBars(elements.playerBars, countByPlayer());
  renderBars(elements.courseBars, countBy("course"));
  renderAnalysisMemos();
}

function saveAnalysisMemo() {
  const items = buildPriorityItems();
  const memo = {
    at: new Date().toISOString(),
    pointCount: state.points.length,
    games: { ...state.games },
    points: { ...state.gamePoints },
    items
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
        return `<article><strong>${escapeHtml(time)} ${escapeHtml(score)} ${escapeHtml(memo.pointCount)}点時点</strong><ul>${(memo.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul></article>`;
      }).join("")
    : `<p>保存した分析メモはまだありません。</p>`;
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

function renderHistory() {
  elements.pointList.innerHTML = state.points
    .slice()
    .reverse()
    .map((point, index) => {
      const number = state.points.length - index;
      const beforeGames = point.scoreBefore?.games || { A: 0, B: 0 };
      const beforePoints = point.scoreBefore?.points || { A: 0, B: 0 };
      const before = `G ${beforeGames.A}-${beforeGames.B} / P ${beforePoints.A}-${beforePoints.B}`;
      const afterGames = point.scoreAfter?.games || beforeGames;
      const afterPoints = point.scoreAfter?.points || beforePoints;
      const after = `G ${afterGames.A}-${afterGames.B} / P ${afterPoints.A}-${afterPoints.B}`;
      const winner = `${displayName(point.winner)}の得点`;
      const actor = playerLabel(point.player);
      const location = [point.course, point.result && point.result !== "イン" ? point.result : ""].filter(Boolean).join(" / ");
      const service = `${point.serveStart || "サービス不明"} / S:${shortDisplayName(point.server)}`;
      const meta = [location, point.phase || "場面不明", service, point.memo].filter(Boolean).join("・");
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
    })
    .join("");
}

function render() {
  renderScore();
  renderStats();
  renderHistory();
}

function exportCsv() {
  const rows = [
    ["No", "日付", "時間帯", "天気", "気温", "風", "風向き", "コート種別", "コート状態", "種別", "相手基本布陣", "区分", "コート", "試合形式", "得点側", "サービスサイド", "ゲーム", "ポイント", "場面", "サービスの入り方", "ポイント内容", "ボールの結果", "誰のプレー", "ショット", "打球面", "コース", "ラリー数", "ゲーム取得", "メモ", "記録時刻"],
    ...state.points.map((point, index) => [
      index + 1,
      state.matchInfo.date,
      state.matchInfo.timeOfDay,
      state.matchInfo.weather,
      state.matchInfo.temperature,
      state.matchInfo.wind,
      state.matchInfo.windSide,
      state.matchInfo.surface,
      state.matchInfo.courtCondition,
      state.matchType === "singles" ? "シングルス" : "ダブルス",
      state.matchInfo.opponentFormation,
      state.matchInfo.event,
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

function getSummaryImageData() {
  const data = getAnalysisData();
  const phaseCounts = getPhaseCounts();
  const info = state.matchInfo || defaultState.matchInfo;
  const typeLabel = state.matchType === "singles" ? "シングルス" : "ダブルス";
  const opponentError = topEntry(countByOutcomeType("error", state.points.filter((point) => point.winner === "A")));
  const weather = [info.weather, info.temperature ? `${info.temperature}℃` : "", info.wind !== "未記録" ? `風:${info.wind}` : "", info.windSide !== "未記録" ? info.windSide : ""]
    .filter(Boolean)
    .filter((item) => item !== "未記録")
    .join(" / ");
  const court = [info.surface !== "未記録" ? info.surface : "", info.courtCondition !== "未記録" ? info.courtCondition : ""].filter(Boolean).join(" / ");
  const conditionRows = [
    ["日時", [info.date || "日付未記録", info.timeOfDay !== "未記録" ? info.timeOfDay : ""].filter(Boolean).join(" / ")],
    ["大会・区分", info.event && info.event !== "未記録" ? info.event : "未記録"],
    ["会場", info.venue && info.venue !== "未記録" ? info.venue : "未記録"],
    ["天候・気温", [info.weather !== "未記録" ? info.weather : "", info.temperature ? `${info.temperature}℃` : ""].filter(Boolean).join(" / ") || "未記録"],
    ["風", [info.wind !== "未記録" ? info.wind : "", info.windSide !== "未記録" ? info.windSide : ""].filter(Boolean).join(" / ") || "未記録"],
    ["コート", court || "未記録"],
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
      weather,
      court,
      info.event !== "未記録" ? info.event : "",
      info.venue !== "未記録" ? info.venue : ""
    ].filter(Boolean),
    summaryRows: [
      ["記録ポイント", data.total],
      ["得点パターン", data.ownScoredByPattern],
      ["相手ミス得点", data.ownPointsByOpponentError],
      ["ミス失点", data.ownLostByOwnError]
    ],
    priorityItems: buildPriorityItems(),
    detailRows: [
      ["主な得点パターン", `${data.topScore[0]} ${data.topScore[1]}`],
      ["相手の主なミス", `${opponentError[0]} ${opponentError[1]}`],
      ["主な失点ミス", `${data.topError[0]} ${data.topError[1]}`],
      ["第1サービス開始率", data.firstServeRate === null ? "-" : `${data.firstServeRate}%`]
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
  const panelColor = "#ffffff";
  const bgColor = "#f7f8fb";
  canvas.width = width;
  canvas.height = height;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = inkColor;
  ctx.font = '900 52px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillText(summary.title, 56, 82);
  ctx.font = '800 30px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = mutedColor;
  ctx.fillText(summary.subtitle, 56, 128);

  fillRoundedRect(ctx, 56, 160, 968, 352, 18, panelColor);
  strokeRoundedRect(ctx, 56, 160, 968, 352, 18, lineColor);
  ctx.fillStyle = inkColor;
  ctx.font = '900 40px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  drawClampedText(ctx, summary.teams, 88, 220, 904, 48, 1);

  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = mutedColor;
  ctx.fillText("ゲーム", 88, 282);
  ctx.fillText("ポイント", 430, 282);
  ctx.font = '900 56px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = inkColor;
  ctx.fillText(summary.gameScore, 88, 344);
  ctx.fillText(summary.currentPointScore, 430, 344);

  ctx.font = '900 24px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillStyle = mutedColor;
  ctx.fillText("各ゲーム", 88, 402);

  summary.gameScoreRows.slice(0, 9).forEach(([label, score], index) => {
    const col = index % 3;
    const row = Math.floor(index / 3);
    const x = 88 + col * 300;
    const y = 424 + row * 52;
    fillRoundedRect(ctx, x, y, 274, 40, 8, "#f8fafc");
    strokeRoundedRect(ctx, x, y, 274, 40, 8, lineColor, 1.5);
    ctx.fillStyle = mutedColor;
    ctx.font = '900 22px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
    ctx.fillText(label, x + 14, y + 27);
    ctx.fillStyle = inkColor;
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
    ctx.textAlign = "right";
    ctx.fillText(score, x + 252, y + 29);
    ctx.textAlign = "left";
  });

  fillRoundedRect(ctx, 56, 544, 968, 258, 18, panelColor);
  strokeRoundedRect(ctx, 56, 544, 968, 258, 18, lineColor);
  ctx.fillStyle = inkColor;
  ctx.font = '900 32px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillText("試合条件", 88, 598);
  ctx.font = '800 25px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  summary.conditionRows.slice(0, 7).forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 88 + col * 462;
    const y = 648 + row * 38;
    ctx.fillStyle = mutedColor;
    ctx.fillText(label, x, y);
    ctx.fillStyle = inkColor;
    drawClampedText(ctx, value, x + 118, y, 318, 30, 1);
  });

  const summaryStyles = [
    { border: inkColor, fill: "#ffffff", text: inkColor },
    { border: ownColor, fill: "#ffffff", text: ownColor },
    { border: oppColor, fill: "#ffffff", text: oppColor },
    { border: oppColor, fill: "#ffffff", text: oppColor }
  ];
  summary.summaryRows.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = 56 + col * 492;
    const y = 836 + row * 126;
    const style = summaryStyles[index];
    fillRoundedRect(ctx, x, y, 476, 104, 14, style.fill);
    strokeRoundedRect(ctx, x, y, 476, 104, 14, style.border, 4);
    ctx.fillStyle = style.text;
    ctx.font = '900 28px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
    ctx.fillText(label, x + 24, y + 39);
    ctx.font = '900 48px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
    ctx.fillText(String(value), x + 24, y + 88);
  });

  fillRoundedRect(ctx, 56, 1118, 968, 318, 18, panelColor);
  strokeRoundedRect(ctx, 56, 1118, 968, 318, 18, lineColor);
  ctx.fillStyle = "#0f766e";
  ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillText("優先度順メモ", 88, 1176);
  ctx.font = '800 29px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  let y = 1226;
  summary.priorityItems.slice(0, 4).forEach((item, index) => {
    ctx.fillStyle = "#0f766e";
    ctx.fillText(`P${index + 1}`, 88, y);
    ctx.fillStyle = inkColor;
    y = drawClampedText(ctx, item, 142, y, 820, 34, 2);
    y += 8;
  });

  fillRoundedRect(ctx, 56, 1472, 968, 270, 18, panelColor);
  strokeRoundedRect(ctx, 56, 1472, 968, 270, 18, lineColor);
  ctx.fillStyle = inkColor;
  ctx.font = '900 34px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  ctx.fillText("試合後に見る数字", 88, 1530);
  ctx.font = '800 28px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  y = 1584;
  [...summary.detailRows, ...summary.phaseRows].slice(0, 5).forEach(([label, value]) => {
    ctx.fillStyle = mutedColor;
    ctx.fillText(label, 88, y);
    ctx.fillStyle = inkColor;
    ctx.textAlign = "right";
    ctx.fillText(fitText(ctx, value, 360), 984, y);
    ctx.textAlign = "left";
    y += 42;
  });

  ctx.fillStyle = mutedColor;
  ctx.font = '700 24px -apple-system, BlinkMacSystemFont, "Hiragino Sans", "Noto Sans JP", sans-serif';
  const footer = ["端末内で画像生成。データは自動送信されません。", ...summary.meta].join(" / ");
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

function openNewMatchDialog() {
  elements.matchTypeSelect.value = state.matchType || "doubles";
  elements.dialogTeamA.value = state.teams.A;
  elements.dialogTeamB.value = state.teams.B;
  elements.dialogAFront.value = state.players.AFront;
  elements.dialogARear.value = state.players.ARear;
  elements.dialogBFront.value = state.players.BFront;
  elements.dialogBRear.value = state.players.BRear;
  elements.opponentFormationSelect.value = state.matchInfo.opponentFormation || "不明";
  elements.matchFormatSelect.value = state.matchFormat || matchFormatFromGamesToWin(state.gamesToWin);
  elements.matchDateInput.value = state.matchInfo.date || new Date().toISOString().slice(0, 10);
  elements.matchTimeSelect.value = state.matchInfo.timeOfDay || "未記録";
  elements.weatherSelect.value = state.matchInfo.weather || "未記録";
  elements.temperatureInput.value = state.matchInfo.temperature || "";
  elements.windSelect.value = state.matchInfo.wind || "未記録";
  elements.windSideSelect.value = state.matchInfo.windSide || "未記録";
  elements.surfaceSelect.value = state.matchInfo.surface || "未記録";
  elements.courtConditionSelect.value = state.matchInfo.courtCondition || "未記録";
  elements.eventInput.value = state.matchInfo.event || "未記録";
  elements.venueInput.value = state.matchInfo.venue || "未記録";
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
  openNewMatchDialog();
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
$("#startMatchButton").addEventListener("click", newMatch);
elements.matchTypeSelect.addEventListener("change", updateMatchTypeFields);

function updateMatchTypeFields() {
  const singles = elements.matchTypeSelect.value === "singles";
  elements.dialogTeamALabel.textContent = singles ? "自分の名前" : "自ペア名";
  elements.dialogTeamBLabel.textContent = singles ? "相手選手名" : "相手ペア名";
  $$(".doubles-field").forEach((field) => {
    field.hidden = singles;
  });

  if (singles && elements.dialogTeamA.value === "自ペア") elements.dialogTeamA.value = "自分";
  if (singles && elements.dialogTeamB.value === "相手ペア") elements.dialogTeamB.value = "相手選手";
  if (!singles && elements.dialogTeamA.value === "自分") elements.dialogTeamA.value = "自ペア";
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
  if (button.dataset.result) {
    state.selectedResult = button.dataset.result;
  }
  saveState();
  renderScore();
});

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

render();
