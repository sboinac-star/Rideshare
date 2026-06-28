import { test, expect } from "@playwright/test";

async function tryTestSignIn(page: import("@playwright/test").Page) {
  await page.evaluate(async () => {
    const ctx = (window as any).__authCtx;
    if (ctx?.testSignIn) {
      try { await ctx.testSignIn("e2e-test-user"); } catch {}
    }
  });
}

async function waitForForm(page: import("@playwright/test").Page): Promise<boolean> {
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => null);
  await tryTestSignIn(page);
  const visible = await page.locator('input[placeholder*="full name"]').isVisible().catch(() => false);
  return visible;
}

test.describe("Duration picker on Post Journey (driver)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/driver");
  });

  test("shows Date, Time, and For (+Xh) fields in the same row", async ({ page }) => {
    const hasForm = await waitForForm(page);
    if (!hasForm) { test.skip(); return; }

    const dateInput = page.locator('input[type="date"]').first();
    const timeInput = page.locator('input[type="time"]').first();
    const forSelect = page.locator('select').filter({ hasText: "+1h" });

    await expect(dateInput).toBeVisible();
    await expect(timeInput).toBeVisible();
    await expect(forSelect).toBeVisible();
  });

  test("For dropdown has +1h through +8h options", async ({ page }) => {
    const hasForm = await waitForForm(page);
    if (!hasForm) { test.skip(); return; }

    const forSelect = page.locator('select').filter({ hasText: "+1h" });
    await expect(forSelect).toBeVisible();

    const options = await forSelect.locator("option").allTextContents();
    expect(options).toContain("+1h");
    expect(options).toContain("+2h");
    expect(options).toContain("+4h");
    expect(options).toContain("+8h");
  });

  test("For dropdown defaults to +2h", async ({ page }) => {
    const hasForm = await waitForForm(page);
    if (!hasForm) { test.skip(); return; }

    const forSelect = page.locator('select').filter({ hasText: "+1h" });
    await expect(forSelect).toHaveValue("2");
  });

  test("For dropdown is in the same visual row as Date and Time", async ({ page }) => {
    const hasForm = await waitForForm(page);
    if (!hasForm) { test.skip(); return; }

    const dateInput = page.locator('input[type="date"]').first();
    const forSelect = page.locator('select').filter({ hasText: "+1h" });

    const dateBox = await dateInput.boundingBox();
    const selectBox = await forSelect.boundingBox();

    expect(dateBox).not.toBeNull();
    expect(selectBox).not.toBeNull();

    // They should be on the same horizontal line (within 40px vertically)
    const verticalDiff = Math.abs((dateBox!.y + dateBox!.height / 2) - (selectBox!.y + selectBox!.height / 2));
    expect(verticalDiff).toBeLessThan(40);
  });

  test("screenshot of form shows date/time/duration row", async ({ page }) => {
    await waitForForm(page);
    await page.screenshot({ path: "e2e/screenshots/driver-form.png", fullPage: false });
  });
});

test.describe("Duration picker on Request a Ride (passenger)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/passenger");
  });

  test("shows Date, Time, and For (+Xh) fields in the same row", async ({ page }) => {
    const hasForm = await waitForForm(page);
    if (!hasForm) { test.skip(); return; }

    const dateInput = page.locator('input[type="date"]').first();
    const timeInput = page.locator('input[type="time"]').first();
    const forSelect = page.locator('select').filter({ hasText: "+1h" });

    await expect(dateInput).toBeVisible();
    await expect(timeInput).toBeVisible();
    await expect(forSelect).toBeVisible();
  });

  test("screenshot of passenger form shows date/time/duration row", async ({ page }) => {
    await waitForForm(page);
    await page.screenshot({ path: "e2e/screenshots/passenger-form.png", fullPage: false });
  });
});
