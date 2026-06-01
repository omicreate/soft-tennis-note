const { test, expect } = require("@playwright/test");

async function expectNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth - root.clientWidth, body.scrollWidth - body.clientWidth);
  });
  expect(overflow, `${label} should not overflow horizontally`).toBeLessThanOrEqual(2);
}

function buildDenseMatchState() {
  const points = Array.from({ length: 42 }, (_, index) => {
    const ownPoint = index % 3 !== 1;
    const scoreBeforeA = index % 4;
    const scoreBeforeB = (index + 1) % 4;
    const scoreAfterA = ownPoint ? scoreBeforeA + 1 : scoreBeforeA;
    const scoreAfterB = ownPoint ? scoreBeforeB : scoreBeforeB + 1;
    const ownError = !ownPoint && index % 2 === 0;
    const opponentError = ownPoint && index % 2 === 1;

    return {
      winner: ownPoint ? "A" : "B",
      server: index % 2 === 0 ? "A" : "B",
      phase: index < 12 ? "序盤" : index < 28 ? "中盤" : "終盤",
      serveStart: index % 11 === 0 ? "ダブルフォールト" : index % 3 === 0 ? "第2サービスで開始" : "第1サービスで開始",
      outcome: opponentError ? "ストロークミス" : ownError ? "レシーブミス" : index % 5 === 0 ? "スマッシュ" : "ストローク",
      result: ownError ? "ネット" : opponentError ? "バックアウト" : "イン",
      player: ownPoint ? (index % 2 === 0 ? "ARear" : "AFront") : index % 2 === 0 ? "BRear" : "BFront",
      shot: index % 5 === 0 ? "スマッシュ" : index % 4 === 0 ? "ボレー" : "ストローク",
      hand: index % 2 === 0 ? "フォア" : "バック",
      course: index % 4 === 0 ? "クロス" : index % 4 === 1 ? "センター" : index % 4 === 2 ? "ストレート" : "ショート",
      rally: String((index % 8) + 1),
      scoreBefore: { games: { A: Math.floor(index / 12), B: Math.floor(index / 14) }, points: { A: scoreBeforeA, B: scoreBeforeB } },
      scoreAfter: { games: { A: Math.floor(index / 12), B: Math.floor(index / 14) }, points: { A: scoreAfterA, B: scoreAfterB } },
      gameNumber: Math.floor(index / 12) + 1,
      memo: `長文テスト ${index + 1}: サマリー画像の文字量が多い試合でも表示が崩れないか確認する`,
      at: `2026-05-30T05:${String(index).padStart(2, "0")}:00.000Z`
    };
  });

  return {
    matchType: "doubles",
    teams: { A: "青葉高校Aチーム", B: "西町高校Bチーム" },
    players: {
      ARear: "青葉 太郎",
      AFront: "青葉 次郎",
      BRear: "西町 三郎",
      BFront: "西町 四郎"
    },
    matchInfo: {
      date: "2026-05-30",
      startTime: "14:43",
      timeOfDay: "午後",
      tournament: "県高校総体地区予選",
      venueName: "青葉公園庭球場",
      courtNumber: "12",
      matchFormat: "7",
      weather: "晴れ",
      temperature: "暑い",
      wind: "強い",
      surface: "オムニ",
      courtCondition: "乾き",
      opponentFormation: "雁行陣"
    },
    games: { A: 3, B: 2 },
    gamePoints: { A: 3, B: 2 },
    currentGame: 6,
    currentServer: "A",
    finished: false,
    selectedWinner: "A",
    selectedServe: "第1サービスで開始",
    selectedOutcome: "ストローク",
    selectedPlayer: "ARear",
    selectedResult: "イン",
    selectedCourse: "センター",
    points,
    analysisMemos: [
      {
        savedAt: "2026-05-30T05:30:00.000Z",
        scoreLabel: "G 3-2 / P 3-2",
        quickItems: [
          "第1サービス後の3球目を深く入れる",
          "相手後衛のバック側でミスが出ている"
        ],
        reviewItems: [
          "序盤のレシーブミスを減らす",
          "スマッシュ得点後の次ポイントを確認する",
          "終盤の配球を同じ形で再現できるか見る"
        ]
      }
    ]
  };
}

test.describe("mobile layout", () => {
  test("record, analysis, history, archive and summary screens fit mobile widths", async ({ page }, testInfo) => {
    test.setTimeout(45000);
    await page.goto("/index.html?v=165");

    await expect(page.getByText("ソフトテニス試合ノート").first()).toBeVisible();
    await expect(page.getByText("v165・2026-06-01").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "record screen");

    await page.getByRole("button", { name: "分析" }).click();
    await expect(page.locator("#analysisSummary")).toBeVisible();
    await expect(page.getByText("次に見ること").first()).toBeVisible();
    await expect(page.getByText("全体の傾向").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "analysis screen");

    await page.getByRole("button", { name: "履歴" }).click();
    await expect(page.locator("#historyFilterSelect")).toBeVisible();
    await expect(page.locator("#historySortSelect")).toBeVisible();
    await expectNoHorizontalOverflow(page, "history screen");

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "保存済み試合" }).click();
    await expect(page.locator("#archiveSearchInput")).toBeVisible();
    await expect(page.locator("#archiveDateFilterSelect")).toBeVisible();
    await expect(page.locator("#archiveTypeFilterSelect")).toBeVisible();
    await expect(page.locator("#archiveStatusFilterSelect")).toBeVisible();
    await expect(page.locator("#archiveResultFilterSelect")).toBeVisible();
    await expect(page.locator("#archiveTournamentFilterSelect")).toBeVisible();
    await expect(page.locator("#archiveSortSelect")).toBeVisible();
    await expect(page.locator("#archiveCountLabel")).toHaveText(/件/);
    await expect(page.locator("#archiveStorageLabel")).toHaveText(/保存状況: \d+件 \/ 約/);
    await expectNoHorizontalOverflow(page, "archive dialog");
    await page.getByRole("button", { name: "閉じる" }).click();

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByText("引き継ぎ・共有", { exact: true }).click();
    await expect(page.getByRole("button", { name: "引き継ぎ用データを保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "受け取ったデータを読み込む" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "transfer menu");
    await page.getByText("管理用", { exact: true }).click();
    await expect(page.getByRole("button", { name: "今の試合CSVを出力" })).toBeVisible();
    await page.getByRole("button", { name: "閉じる" }).click();

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "サマリー画像を表示" }).click();
    await expect(page.locator("#summaryPreviewImage")).toBeVisible();
    await expect(page.getByRole("button", { name: "共有用" })).toBeVisible();
    await expect(page.getByRole("button", { name: "詳細保存用" })).toBeVisible();
    await page.getByRole("button", { name: "詳細保存用" }).click();
    await expect(page.getByRole("button", { name: "詳細保存用" })).toHaveClass(/active/);
    await expect(page.locator("#shareSummaryImageButton")).toBeVisible();
    await expect(page.getByRole("button", { name: "画像を保存" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "summary dialog");

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("mobile-layout", { body: screenshot, contentType: "image/png" });
  });

  test("summary image dialog keeps dense match data inside the mobile viewport", async ({ page }, testInfo) => {
    await page.addInitScript((state) => {
      localStorage.setItem("soft-tennis-logger-state-v1", JSON.stringify(state));
    }, buildDenseMatchState());

    await page.goto("/index.html?v=165");
    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "サマリー画像を表示" }).click();

    await expect(page.locator("#summaryPreviewImage")).toBeVisible();
    await expect(page.locator("#shareSummaryImageButton")).toBeVisible();
    await expect(page.getByRole("button", { name: "画像を保存" })).toBeVisible();
    await expect(page.getByRole("button", { name: "閉じる" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "dense summary dialog");

    const layout = await page.evaluate(() => {
      const dialog = document.querySelector("#summaryImageDialog");
      const image = document.querySelector("#summaryPreviewImage");
      const share = document.querySelector("#shareSummaryImageButton");
      const save = document.querySelector("#downloadSummaryImageButton");
      const close = document.querySelector(".summary-dialog .action-close");
      const dialogRect = dialog.getBoundingClientRect();
      const imageRect = image.getBoundingClientRect();
      const shareRect = share.getBoundingClientRect();
      const saveRect = save.getBoundingClientRect();
      const closeRect = close.getBoundingClientRect();
      return {
        dialogWidth: dialogRect.width,
        imageHeight: imageRect.height,
        imageNaturalWidth: image.naturalWidth,
        imageNaturalHeight: image.naturalHeight,
        shareTop: Math.round(shareRect.top),
        saveTop: Math.round(saveRect.top),
        closeTop: Math.round(closeRect.top),
        closeWidth: closeRect.width,
        shareBottom: shareRect.bottom,
        saveBottom: saveRect.bottom,
        viewportWidth: window.innerWidth
      };
    });

    expect(layout.imageNaturalWidth).toBeGreaterThan(0);
    expect(layout.imageNaturalHeight).toBeGreaterThan(0);
    expect(layout.imageHeight).toBeGreaterThan(280);
    expect(layout.shareTop).toBe(layout.saveTop);
    expect(layout.closeTop).toBeGreaterThan(layout.shareTop);
    expect(layout.closeWidth).toBeGreaterThan(layout.dialogWidth * 0.82);

    await page.getByRole("button", { name: "詳細保存用" }).click();
    const detailMetrics = await page.evaluate(() => {
      const canvas = document.createElement("canvas");
      return window.drawSummaryImage(canvas, window.getSummaryImageData(), "detail");
    });
    expect(detailMetrics.contentBottom).toBeLessThan(detailMetrics.footerTop);

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("dense-summary-dialog", { body: screenshot, contentType: "image/png" });
  });
});
