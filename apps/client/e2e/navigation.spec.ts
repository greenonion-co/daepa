import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("intro header CTA → sign-in page", async ({ page }) => {
    await page.goto("/intro");
    await page.locator("header").getByRole("link", { name: "시작하기" }).click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("로그인")).toBeVisible();
  });

  test("intro hero CTA → sign-in page", async ({ page }) => {
    await page.goto("/intro");
    await page.getByRole("link", { name: /지금 시작하기/ }).click();

    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("/@username rewrites to showroom via middleware without 500", async ({ page }) => {
    // 미들웨어가 /@test-user → /showroom/test-user로 리라이트
    const response = await page.goto("/@test-user");

    // 미들웨어가 정상 처리 (500이 아님)
    expect(response?.status()).not.toBe(500);
    // /sign-in으로 리다이렉트되면 안 됨 (showroom은 공개 페이지)
    expect(page.url()).not.toContain("/sign-in");
  });

  test("protected route redirect preserves sign-in page functionality", async ({ page }) => {
    // /settings 접근 → /sign-in 리다이렉트 → OAuth 버튼 동작 확인
    await page.goto("/settings");
    await expect(page).toHaveURL(/\/sign-in/);

    // 리다이렉트 후에도 로그인 페이지가 완전히 렌더링됨
    await expect(page.getByRole("link", { name: /구글로 시작하기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /카카오로 시작하기/ })).toBeVisible();
  });
});
