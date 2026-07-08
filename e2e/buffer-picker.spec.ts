import { test, expect } from "@playwright/test";

// Tests that require a signed-in user are skipped when running against staging.
// To run them: sign in manually, export cookies, and pass them via storageState.
const REQUIRES_AUTH = process.env.PLAYWRIGHT_AUTHED === "1";

test.describe("Buffer time window — driver form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/driver");
    await page.waitForLoadState("networkidle");
  });

  test("screenshot: driver page renders", async ({ page }) => {
    await page.screenshot({ path: "test-results/driver-page.png", fullPage: true });
  });

  test("buffer select is visible on the form when signed in", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    await expect(page.getByRole("option", { name: /±1h/i })).toBeVisible({ timeout: 10000 });
  });

  test("buffer options include all 5 choices", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    for (const label of ["±30m", "±1h", "±2h", "±3h", "±4h"]) {
      await expect(page.getByRole("option", { name: label }).first()).toBeAttached({ timeout: 10000 });
    }
  });

  test("'Around' label is visible next to the time input", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    await expect(page.getByText("Around").first()).toBeVisible({ timeout: 10000 });
  });

  test("'Buffer' label is visible next to the buffer select", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    await expect(page.getByText("Buffer").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Buffer time window — passenger form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/passenger");
    await page.waitForLoadState("networkidle");
  });

  test("screenshot: passenger page renders", async ({ page }) => {
    await page.screenshot({ path: "test-results/passenger-page.png", fullPage: true });
  });

  test("buffer select is visible on the passenger form when signed in", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    await expect(page.getByRole("option", { name: /±1h/i })).toBeVisible({ timeout: 10000 });
  });

  test("'Around' and 'Buffer' labels visible on passenger form", async ({ page }) => {
    test.skip(!REQUIRES_AUTH, "Requires PLAYWRIGHT_AUTHED=1 — needs signed-in session");
    await expect(page.getByText("Around").first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Buffer").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Home page — time window display", () => {
  test("screenshot: home page renders", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/home-page.png", fullPage: true });
  });

  test("home page loads without errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    expect(errors.filter((e) => !e.includes("firebase"))).toHaveLength(0);
  });
});
