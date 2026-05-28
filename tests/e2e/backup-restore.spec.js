const { test, expect } = require("@playwright/test");

test.describe("match data backup restore", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
    });
  });

  test("restores match data through the file picker", async ({ page }) => {
    await page.goto("/index.html?v=143");

    const backup = {
      app: "soft-tennis-note",
      schemaVersion: 1,
      appVersion: "v143",
      exportedAt: "2026-05-28T04:30:00.000Z",
      state: {
        matchType: "doubles",
        teams: { A: "読込 自チーム", B: "読込 相手ペア" },
        players: {
          ARear: "読込 自後衛",
          AFront: "読込 自前衛",
          BRear: "読込 相手後衛",
          BFront: "読込 相手前衛"
        },
        matchInfo: {
          date: "2026-05-28",
          timeOfDay: "午後",
          tournament: "読込テスト大会",
          venueName: "読込テスト会場",
          courtNumber: "1",
          matchFormat: "7",
          opponentFormation: "雁行陣"
        },
        games: { A: 1, B: 0 },
        gamePoints: { A: 2, B: 1 },
        points: [
          {
            winner: "A",
            server: "A",
            phase: "序盤",
            serveStart: "第1サービスで開始",
            outcome: "ストローク",
            result: "イン",
            player: "ARear",
            shot: "ストローク",
            hand: "フォア",
            course: "センター",
            rally: "3",
            scoreBefore: { games: { A: 0, B: 0 }, points: { A: 0, B: 0 } },
            scoreAfter: { games: { A: 0, B: 0 }, points: { A: 1, B: 0 } },
            gameNumber: 1,
            memo: "読込確認",
            at: "2026-05-28T04:30:00.000Z"
          }
        ]
      },
      archivedMatches: [
        {
          id: "restore-e2e-archive",
          savedAt: "2026-05-28T04:31:00.000Z",
          title: "読込済み保存試合",
          pointCount: 1,
          finished: false,
          state: {
            matchType: "doubles",
            teams: { A: "保存 自チーム", B: "保存 相手ペア" },
            players: {
              ARear: "保存 自後衛",
              AFront: "保存 自前衛",
              BRear: "保存 相手後衛",
              BFront: "保存 相手前衛"
            },
            matchInfo: { date: "2026-05-28", tournament: "保存テスト大会" },
            games: { A: 0, B: 0 },
            gamePoints: { A: 0, B: 0 },
            points: []
          }
        }
      ]
    };

    page.on("dialog", async (dialog) => {
      expect(dialog.message()).toContain("試合データを読み込む");
      await dialog.accept();
    });

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByText("管理用").click();

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.getByRole("button", { name: "試合データを読み込む" }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: "soft-tennis-note-restore-e2e.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(backup), "utf8")
    });

    await expect(page.locator("#teamAName")).toHaveValue("読込 自チーム");
    await expect(page.locator("#teamBName")).toHaveValue("読込 相手ペア");
    await expect(page.locator("#liveTeamAGames")).toHaveText("1");
    await expect(page.locator("#liveTeamAPoints")).toHaveText("2");

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "保存済み試合" }).click();
    await expect(page.locator("#archiveCountLabel")).toHaveText("1件");
    await expect(page.locator("#archivedMatchList")).toContainText("読込済み保存試合");
  });
});
