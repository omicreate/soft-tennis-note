const SOFT_TENNIS_CONFIG = {
  APP_VERSION: "v140",
  STORAGE_KEY: "soft-tennis-logger-state-v1",
  ARCHIVE_STORAGE_KEY: "soft-tennis-logger-archive-v1",
  MAX_ARCHIVED_MATCHES: 30,
  SCORING_OUTCOMES: ["ストローク得点", "ボレー得点", "スマッシュ得点", "サービス得点", "レシーブ得点", "ロビング得点"],
  ERROR_OUTCOMES: ["ダブルフォールト", "レシーブミス", "ストロークミス", "ボレーミス", "スマッシュミス", "その他"],
  ANALYSIS_COMMENT_RULES: {
    attackRateHigh: 60,
    opponentErrorRateHigh: 60,
    firstServeLow: 60,
    earlyLostAlert: 3,
    quickLimit: 2,
    priorityLimit: 4,
    summaryLimit: 5,
    shareSummaryComments: 3,
    detailSummaryComments: 5,
    shareNextItems: 2,
    detailNextItems: 3
  },
  ANALYSIS_COMMENT_MESSAGES: {
    scoreTypeBalancedLabel: "得点タイプ: バランス型",
    scoreTypeBalancedText: "得点パターンと相手ミス得点が混ざった試合です。",
    scoreTypePendingLabel: "得点タイプ: 未判定",
    scoreTypePendingText: "{ownSide}の得点がまだありません。",
    scoreTypeAttackLabel: "得点タイプ: 攻撃型",
    scoreTypeAttackText: "{ownSide}の得点パターンが多い試合です。再現したい形を確認しましょう。",
    scoreTypeOpponentErrorLabel: "得点タイプ: 相手ミス誘発型",
    scoreTypeOpponentErrorText: "相手のミスによる得点が多い試合です。どの配球でミスを誘えたか確認しましょう。",
    quickNoRecord: "まだ記録がありません。まずは1ポイント記録してください。",
    quickDoubleFault: "第2サービスは安全優先。ダブルフォールトを止める。",
    quickReceiveMiss: "レシーブはまず返す。強打より深く入れる。",
    quickEarlyLost: "最初の2本は返球優先。入りで簡単に落とさない。",
    quickFirstServeLow: "第1サービスは確率重視。入れてから展開する。",
    quickOpponentErrorMore: "相手ミス得点が多め。自チームで取る形を1つ作る。",
    quickTopScore: "良い形は「{topScore}」。次も同じ形を使う。",
    quickBalanced: "大きな偏りは少なめ。今のリズムを崩さず、先にミスしない。",
    summaryNoRecord: "まだ記録が少ないため、数ポイント記録して傾向を見る",
    summaryPointDiffPositive: "合計ポイントは{pointDiff}。ゲーム結果だけでなく内容でも押せている",
    summaryPointDiffNegative: "合計ポイントは{pointDiff}。ゲーム前半や簡単な失点を減らす余地がある",
    summaryPointDiffEven: "合計ポイントは{pointDiff}。勝敗に関係なく内容は接戦",
    summaryOwnErrorHigh: "ミス失点{ownLostByOwnError}本が得点パターン{ownScoredByPattern}本を上回る。まず失点を減らす",
    summaryAttackHigh: "得点の{attackRate}%が自チームの得点パターン。良い形を次の試合でも再現したい",
    summaryOpponentErrorHigh: "得点の{opponentErrorRate}%が相手ミス。相手が崩れた配球や狙い所を確認したい",
    summaryServeReceive: "DF{ownDoubleFaults}本、レシーブミス{ownReceiveMisses}本。サービス・レシーブの入りを優先",
    summaryEarlyLost: "最初の2本での失点が{ownEarlyLost}本。1本目、2本目は返球優先",
    summaryTopScore: "主な得点は「{topScore}」{topScoreCount}本。練習でも同じ形を確認"
  },
  TRIAL_GUIDES: {
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
  },
  defaultState: {
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
  }
};

globalThis.SOFT_TENNIS_CONFIG = SOFT_TENNIS_CONFIG;
Object.assign(globalThis, SOFT_TENNIS_CONFIG);
