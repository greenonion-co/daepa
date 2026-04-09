import { test, expect } from "@playwright/test";

/**
 * Production 사이트 헬스 체크 테스트
 * baseURL을 PRODUCTION_URL 환경변수로 오버라이드하여 실행
 * 로컬: PRODUCTION_URL=https://breedy.kr pnpm --filter client test:e2e --grep @production
 * CI: GitHub Actions cron schedule로 자동 실행
 */

test.describe("@production Health Check", () => {
  test("home page returns 200", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).toBe(200);
  });

  test("intro page renders correctly", async ({ page }) => {
    await page.goto("/intro");

    await expect(page.locator("header").getByText("BREEDY")).toBeVisible();
    await expect(page.getByText("개체 관리부터")).toBeVisible();
    await expect(page.getByText("분양까지")).toBeVisible();
    await expect(page.getByText("개체룸")).toBeVisible();
    await expect(page.getByText("브리딩룸")).toBeVisible();
    await expect(page.getByText("분양룸")).toBeVisible();
  });

  test("sign-in page renders OAuth buttons", async ({ page }) => {
    await page.goto("/sign-in");

    await expect(page.getByText("로그인")).toBeVisible();
    await expect(page.getByRole("link", { name: /구글로 시작하기/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /카카오로 시작하기/ })).toBeVisible();
  });

  test("protected routes redirect to sign-in", async ({ page }) => {
    await page.goto("/pet");
    await expect(page).toHaveURL(/\/sign-in/);
  });

  test("404 page works for invalid routes", async ({ page }) => {
    const response = await page.goto("/this-does-not-exist-xyz");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("페이지를 찾을 수 없습니다.")).toBeVisible();
  });

  test("home page loads pet feed data", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // Production에서는 백엔드가 동작하므로 에러가 아닌 컨텐츠가 나와야 함
    const errorText = page.getByText("피드를 불러오는데 실패했습니다");
    await expect(errorText).not.toBeVisible({ timeout: 10000 });
  });
});
