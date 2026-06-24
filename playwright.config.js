const { defineConfig, devices } = require("@playwright/test");

const targetURL = process.env.PLAYWRIGHT_BASE_URL || "https://omicreate.github.io/soft-tennis-note/";
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND;

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: targetURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "iPhone SE",
      use: {
        ...devices["iPhone SE"],
        browserName: "chromium",
        hasTouch: true
      }
    },
    {
      name: "iPhone 15",
      use: {
        ...devices["iPhone 15"],
        browserName: "chromium",
        hasTouch: true
      }
    },
    {
      name: "Pixel 8",
      use: {
        ...devices["Pixel 7"],
        browserName: "chromium",
        viewport: { width: 412, height: 915 },
        hasTouch: true
      }
    }
  ],
  webServer: webServerCommand
    ? {
        command: webServerCommand,
        url: targetURL,
        reuseExistingServer: !process.env.CI,
        stdout: "ignore",
        stderr: "pipe"
      }
    : undefined
});
