import { defineConfig, devices } from "@playwright/test";

// Use PLAYWRIGHT_BASE_URL env var to point at staging or any other deployment.
// Falls back to localhost:3000 for local dev (requires a running dev server).
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  retries: 1,
  use: {
    baseURL,
    headless: true,
    launchOptions: {
      executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Only start a local dev server when running against localhost and no server is already up.
  // Set PLAYWRIGHT_BASE_URL to a staging URL to skip the local server entirely.
  ...(baseURL.startsWith("http://localhost")
    ? {
        webServer: {
          command: "npm run dev",
          url: baseURL,
          reuseExistingServer: true,
          timeout: 120000,
        },
      }
    : {}),
});
