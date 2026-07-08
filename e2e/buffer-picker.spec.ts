import { test, expect } from "@playwright/test";

// Helper: returns true if the page is showing the sign-in wall (not authenticated).
// Waits for the page to fully hydrate before checking.
async function isAuthWall(page: import("@playwright/test").Page): Promise<boolean> {
  await page.waitForLoadState("networkidle");
  return page.getByRole("button", { name: /sign in with phone/i }).isVisible().catch(() => false);
}

test.describe("Buffer time window — driver form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/driver");
  });

  test("screenshot: driver page renders", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/driver-page.png", fullPage: true });
  });

  test("buffer select is visible on the form when signed in", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
    await expect(page.getByRole("option", { name: /±1h/i })).toBeVisible({ timeout: 10000 });
  });

  test("buffer options include all 5 choices", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
    for (const label of ["±30m", "±1h", "±2h", "±3h", "±4h"]) {
      await expect(page.getByRole("option", { name: label }).first()).toBeAttached({ timeout: 10000 });
    }
  });

  test("'Around' label is visible next to the time input", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
    await expect(page.getByText("Around").first()).toBeVisible({ timeout: 10000 });
  });

  test("'Buffer' label is visible next to the buffer select", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
    await expect(page.getByText("Buffer").first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Buffer time window — passenger form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/passenger");
  });

  test("screenshot: passenger page renders", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/passenger-page.png", fullPage: true });
  });

  test("buffer select is visible on the passenger form when signed in", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
    await expect(page.getByRole("option", { name: /±1h/i })).toBeVisible({ timeout: 10000 });
  });

  test("'Around' and 'Buffer' labels visible on passenger form", async ({ page }) => {
    if (await isAuthWall(page)) { test.skip(); return; }
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
