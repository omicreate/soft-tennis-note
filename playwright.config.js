const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL: "http://127.0.0.1:4175",
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
  webServer: {
    command: "python3 -m http.server 4175",
    url: "http://127.0.0.1:4175/index.html",
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "pipe"
  }
});
