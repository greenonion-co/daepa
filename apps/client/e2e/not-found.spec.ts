import { test, expect } from "@playwright/test";

test.describe("404 Not Found page", () => {
  test("returns 404 status for non-existent route", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist-abc123");
    expect(response?.status()).toBe(404);
  });

  test("displays not found message with icon", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-abc123");

    await expect(page.getByText("페이지를 찾을 수 없습니다.")).toBeVisible();
  });

  test("various invalid routes all return 404", async ({ page }) => {
    const invalidRoutes = ["/invalid-page", "/foo/bar/baz", "/123abc"];

    for (const route of invalidRoutes) {
      const response = await page.goto(route);
      expect(response?.status()).toBe(404);
      await expect(page.getByText("페이지를 찾을 수 없습니다.")).toBeVisible();
    }
  });
});
