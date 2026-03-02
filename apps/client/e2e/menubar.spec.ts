import { test, expect } from "@playwright/test";

test.describe("Menubar - guest user", () => {
  test("shows BREEDY logo on home page", async ({ page }) => {
    await page.goto("/");

    const logo = page.getByRole("heading", { name: "BREEDY" });
    await expect(logo).toBeVisible();
  });

  test("logo links to home page", async ({ page }) => {
    await page.goto("/sign-in");

    const logoLink = page.getByRole("link", { name: /BREEDY|B\./ });
    await expect(logoLink).toHaveAttribute("href", "/");
  });

  test("does not show navigation links for guest user", async ({ page }) => {
    await page.goto("/");

    // SIDEBAR_ITEMS 메뉴는 게스트에게 보이지 않아야 함
    await expect(page.getByRole("link", { name: "개체룸" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "브리딩룸" })).not.toBeVisible();
    await expect(page.getByRole("link", { name: "분양룸" })).not.toBeVisible();
  });

  test("does not show notification or settings icons for guest", async ({ page }) => {
    await page.goto("/");

    // 알림/설정 아이콘은 로그인된 유저에게만
    const notificationLink = page.getByRole("link", { name: /notifications/ });
    const settingsLink = page.getByRole("link", { name: /settings/ });
    await expect(notificationLink).not.toBeVisible();
    await expect(settingsLink).not.toBeVisible();
  });

  test("login button is not shown on sign-in page", async ({ page }) => {
    await page.goto("/sign-in", { waitUntil: "networkidle" });

    // /sign-in 페이지에서는 Menubar의 로그인 버튼이 숨겨져야 함
    // (sign-in 페이지 자체의 OAuth 버튼과 구분)
    const menubarLoginButtons = page.locator("a[href='/sign-in']").filter({
      hasText: "로그인",
    });

    // Menubar의 "로그인" 링크가 0개여야 함
    await expect(menubarLoginButtons).toHaveCount(0);
  });
});

test.describe("Menubar - intro page", () => {
  test("menubar is not shown on intro page (intro has its own header)", async ({ page }) => {
    await page.goto("/intro");

    // Intro 페이지는 자체 header를 사용, Menubar의 BREEDY 로고와 구분
    // Intro header에 BREEDY가 있고, 시작하기 버튼이 있음
    const header = page.locator("header");
    await expect(header.getByText("BREEDY")).toBeVisible();
    await expect(header.getByRole("link", { name: "시작하기" })).toBeVisible();
  });
});
