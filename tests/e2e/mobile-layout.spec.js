const { test, expect } = require("@playwright/test");

async function expectNoHorizontalOverflow(page, label) {
  const overflow = await page.evaluate(() => {
    const root = document.documentElement;
    const body = document.body;
    return Math.max(root.scrollWidth - root.clientWidth, body.scrollWidth - body.clientWidth);
  });
  expect(overflow, `${label} should not overflow horizontally`).toBeLessThanOrEqual(2);
}

test.describe("mobile layout", () => {
  test("record, analysis, history, archive and summary screens fit mobile widths", async ({ page }, testInfo) => {
    await page.goto("/index.html?v=131");

    await expect(page.getByText("ソフトテニス試合ノート").first()).toBeVisible();
    await expect(page.getByText("v131・2026-05-28").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "record screen");

    await page.getByRole("button", { name: "分析" }).click();
    await expect(page.locator("#analysisSummary")).toBeVisible();
    await expect(page.getByText("今すぐ意識すること").first()).toBeVisible();
    await expectNoHorizontalOverflow(page, "analysis screen");

    await page.getByRole("button", { name: "履歴" }).click();
    await expect(page.locator("#historyFilterSelect")).toBeVisible();
    await expect(page.locator("#historySortSelect")).toBeVisible();
    await expectNoHorizontalOverflow(page, "history screen");

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "保存済み試合" }).click();
    await expect(page.locator("#archiveSearchInput")).toBeVisible();
    await expect(page.locator("#archiveSortSelect")).toBeVisible();
    await expect(page.locator("#archiveCountLabel")).toHaveText(/件/);
    await expectNoHorizontalOverflow(page, "archive dialog");
    await page.getByRole("button", { name: "閉じる" }).click();

    await page.getByRole("button", { name: "メニュー" }).click();
    await page.getByRole("button", { name: "サマリー画像を表示" }).click();
    await expect(page.locator("#summaryPreviewImage")).toBeVisible();
    await expect(page.getByRole("button", { name: "共有" })).toBeVisible();
    await expect(page.getByRole("button", { name: "画像を保存" })).toBeVisible();
    await expectNoHorizontalOverflow(page, "summary dialog");

    const screenshot = await page.screenshot({ fullPage: true });
    await testInfo.attach("mobile-layout", { body: screenshot, contentType: "image/png" });
  });
});
