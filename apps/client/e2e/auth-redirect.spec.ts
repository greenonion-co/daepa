import { test, expect } from "@playwright/test";

test.describe("Auth redirects for protected routes", () => {
  const protectedRoutes = [
    { path: "/pet", name: "개체룸" },
    { path: "/hatching", name: "브리딩룸" },
    { path: "/adoption", name: "분양룸" },
    { path: "/notifications", name: "알림" },
    { path: "/settings", name: "설정" },
  ];

  for (const route of protectedRoutes) {
    test(`${route.path} (${route.name}) redirects to /sign-in`, async ({ page }) => {
      await page.goto(route.path);

      // (브리더스룸) layout이 refreshToken 쿠키 없으면 /sign-in으로 리다이렉트
      await expect(page).toHaveURL(/\/sign-in/);

      // 리다이렉트 후 로그인 페이지가 정상 렌더링
      await expect(page.getByText("로그인")).toBeVisible();
      await expect(page.getByRole("link", { name: /구글로 시작하기/ })).toBeVisible();
    });
  }

  test("pet detail page is accessible without auth (public path)", async ({ page }) => {
    // /pet/[petId]는 PUBLIC_PATHS로 비로그인 접근 허용
    // 실제 petId가 없으므로 404이지만, /sign-in으로 리다이렉트되면 안 됨
    await page.goto("/pet/test-pet-id-123");

    // 로그인 페이지가 아닌 다른 페이지여야 함
    expect(page.url()).not.toContain("/sign-in");
  });
});
