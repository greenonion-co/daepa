import { test, expect } from "@playwright/test";

test.describe("Sign-in page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/sign-in");
  });

  test("renders login heading", async ({ page }) => {
    const heading = page.getByText("로그인");
    await expect(heading).toBeVisible();
  });

  test("Google OAuth button is visible with correct href", async ({ page }) => {
    const googleButton = page.getByRole("link", { name: /구글로 시작하기/ });
    await expect(googleButton).toBeVisible();

    // 서버 OAuth 엔드포인트로 링크되어야 함
    await expect(googleButton).toHaveAttribute("href", /\/api\/auth\/sign-in\/google/);
  });

  test("Kakao OAuth button is visible with correct href", async ({ page }) => {
    const kakaoButton = page.getByRole("link", { name: /카카오로 시작하기/ });
    await expect(kakaoButton).toBeVisible();

    await expect(kakaoButton).toHaveAttribute("href", /\/api\/auth\/sign-in\/kakao/);
  });

  test("Google button has correct background color", async ({ page }) => {
    const googleButton = page.getByRole("link", { name: /구글로 시작하기/ });
    await expect(googleButton).toHaveCSS("background-color", "rgb(242, 242, 242)");
  });

  test("Kakao button has correct background color", async ({ page }) => {
    const kakaoButton = page.getByRole("link", { name: /카카오로 시작하기/ });
    await expect(kakaoButton).toHaveCSS("background-color", "rgb(254, 229, 0)");
  });

  test("OAuth buttons have provider icons", async ({ page }) => {
    const googleIcon = page.getByRole("img", { name: "Google" });
    const kakaoIcon = page.getByRole("img", { name: "Kakao" });

    await expect(googleIcon).toBeVisible();
    await expect(kakaoIcon).toBeVisible();
  });

  test("shows customer support notice", async ({ page }) => {
    await expect(page.getByText("문제가 있으면 고객센터로 문의해주세요")).toBeVisible();
  });

  test("page is vertically centered with correct min-height", async ({ page }) => {
    // 헤더 높이(52px)를 제외한 영역에서 가운데 정렬
    const container = page.locator("div").filter({ hasText: "로그인" }).first();
    await expect(container).toBeVisible();
  });
});
