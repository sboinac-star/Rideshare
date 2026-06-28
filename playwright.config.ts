import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30000,
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        launchOptions: {
          executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell",
          args: ["--no-sandbox", "--disable-setuid-sandbox"],
        },
      },
    },
  ],
  use: {
    baseURL: "http://localhost:3000",
  },
  webServer: undefined,
});
