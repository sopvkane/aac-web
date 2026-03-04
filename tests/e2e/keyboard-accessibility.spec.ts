import { expect, test } from "playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/auth/me", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ detail: "Unauthorized" }),
    });
  });
});

test("keyboard user can reach and activate skip link", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const skipLink = page.getByRole("link", { name: "Skip to main content" });
  await expect(skipLink).toBeVisible();
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(/#main$/);
});

test("keyboard user can switch sign-in mode tabs", async ({ page }) => {
  await page.goto("/");

  const signInHeading = page.getByRole("heading", { name: "Sign in with your account" });
  await expect(signInHeading).toBeVisible();

  const signInTab = page.getByRole("tab", { name: "Sign in" });
  await signInTab.focus();
  await page.keyboard.press("ArrowRight");

  await expect(page.getByRole("heading", { name: "Quick access with PIN" })).toBeVisible();
});
