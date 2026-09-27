import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: { baseURL: "http://127.0.0.1:3100", trace: "retain-on-failure" },
  webServer: { command: "set NEXT_DIST_DIR=.next-playwright&& npm run dev -- --port 3100", url: "http://127.0.0.1:3100", reuseExistingServer: false, timeout: 120_000 },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"], browserName: "chromium", channel: "chrome" } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"], browserName: "chromium", channel: "chrome" } },
  ],
});
