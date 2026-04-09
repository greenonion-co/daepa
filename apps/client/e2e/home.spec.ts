import { test, expect } from "@playwright/test";

test.describe("Home page", () => {
  test("loads without 500 error", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.status()).not.toBe(500);
  });

  test("does not show MY filter toggle for unauthenticated user", async ({ page }) => {
    await page.goto("/");

    // FloatingToggle (전체/MY)는 로그인된 유저에게만 보임
    const myToggle = page.locator("button", { hasText: "MY" });
    await expect(myToggle).not.toBeVisible();
  });

  test("renders page content without crash", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });

    // 백엔드 상태에 따라 다른 결과:
    // 1. 백엔드 연결됨 + 데이터 있음: 펫 카드 목록
    // 2. 백엔드 연결됨 + 데이터 없음: "아직 공개된 개체가 없어요"
    // 3. 백엔드 미연결: "피드를 불러오는데 실패했습니다" 또는 로딩
    // 어떤 경우든 페이지가 크래시 없이 렌더링되어야 함
    const body = page.locator("body");
    await expect(body).not.toBeEmpty();
  });

  test("guest user does not see logged-in-only elements", async ({ page }) => {
    await page.goto("/");

    // FloatingToggle 자체가 없어야 함
    const floatingToggle = page.locator("button", { hasText: "전체" });
    await expect(floatingToggle).not.toBeVisible();
  });
});
