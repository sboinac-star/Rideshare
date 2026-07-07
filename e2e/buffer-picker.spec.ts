import { test, expect } from "@playwright/test";

// These tests verify the ±buffer time window UI on driver and passenger forms.
// Tests that require Firebase auth skip gracefully — screenshots always run.

test.describe("Buffer time window — driver form", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/driver");
  });

  test("screenshot: driver page renders", async ({ page }) => {
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "test-results/driver-page.png", fullPage: true });
  });

  test("buffer select is visible on the form when signed in", async ({ page }) => {
    // If the sign-in wall appears, skip — we can't auth in CI
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    // Buffer select should have ± options
    const bufferOption = page.getByRole("option", { name: /±1h/i });
    await expect(bufferOption).toBeVisible({ timeout: 5000 });
  });

  test("buffer options include all 5 choices", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    for (const label of ["±30m", "±1h", "±2h", "±3h", "±4h"]) {
      await expect(page.getByRole("option", { name: label }).first()).toBeAttached({ timeout: 5000 });
    }
  });

  test("'Around' label is visible next to the time input", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await expect(page.getByText("Around").first()).toBeVisible({ timeout: 5000 });
  });

  test("'Buffer' label is visible next to the buffer select", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await expect(page.getByText("Buffer").first()).toBeVisible({ timeout: 5000 });
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
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    const bufferOption = page.getByRole("option", { name: /±1h/i });
    await expect(bufferOption).toBeVisible({ timeout: 5000 });
  });

  test("'Around' and 'Buffer' labels visible on passenger form", async ({ page }) => {
    const signInButton = page.getByRole("button", { name: /sign in with phone/i });
    if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip();
      return;
    }

    await expect(page.getByText("Around").first()).toBeVisible({ timeout: 5000 });
    await expect(page.getByText("Buffer").first()).toBeVisible({ timeout: 5000 });
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
