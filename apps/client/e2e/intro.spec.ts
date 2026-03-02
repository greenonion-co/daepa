import { test, expect } from "@playwright/test";

test.describe("Intro page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/intro");
  });

  test("fixed nav bar has BREEDY brand and CTA button", async ({ page }) => {
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header.getByText("BREEDY")).toBeVisible();

    const ctaButton = header.getByRole("link", { name: "시작하기" });
    await expect(ctaButton).toHaveAttribute("href", "/sign-in");
  });

  test("hero section renders headline, subtext, and badge", async ({ page }) => {
    // 뱃지
    await expect(page.getByText("크레스티드 게코 브리더를 위한 앱")).toBeVisible();

    // 메인 헤드라인
    await expect(page.getByRole("heading", { level: 1 })).toContainText("개체 관리부터");
    await expect(page.getByText("분양까지")).toBeVisible();

    // 서브 텍스트
    await expect(page.getByText("엑셀 대신, 기록장 대신.")).toBeVisible();
    await expect(page.getByText("브리더를 위한 단 하나의 앱.")).toBeVisible();
  });

  test("hero CTA buttons link to sign-in", async ({ page }) => {
    const startButton = page.getByRole("link", { name: /지금 시작하기/ });
    await expect(startButton).toBeVisible();
    await expect(startButton).toHaveAttribute("href", "/sign-in");

    const kakaoButton = page.getByRole("link", { name: "카카오로 시작", exact: true });
    await expect(kakaoButton).toBeVisible();
    await expect(kakaoButton).toHaveAttribute("href", "/sign-in");
  });

  test("scroll hint is visible at bottom of hero", async ({ page }) => {
    await expect(page.getByText("Scroll")).toBeVisible();
  });

  test("feature sections display with correct content", async ({ page }) => {
    // 개체룸 섹션
    await expect(page.getByText("개체룸")).toBeVisible();
    await expect(page.getByText("내 모든 개체를")).toBeVisible();
    await expect(page.getByText("종·모프·형질 상세 기록")).toBeVisible();
    await expect(page.getByText("사진으로 성장 과정 관리")).toBeVisible();
    await expect(page.getByText("부모 연결 & 브리딩맵 자동 생성")).toBeVisible();

    // 브리딩룸 섹션
    await expect(page.getByText("브리딩룸")).toBeVisible();
    await expect(page.getByText("브리딩 성과를")).toBeVisible();
    await expect(page.getByText("페어 생성 & 메모 관리")).toBeVisible();

    // 분양룸 섹션
    await expect(page.getByText("분양룸")).toBeVisible();
    await expect(page.getByText("분양 수익까지")).toBeVisible();
    await expect(page.getByText("직거래·택배·도매·수출 이력 기록")).toBeVisible();
  });

  test("each feature section has a phone mockup with video", async ({ page }) => {
    const videos = page.locator("video");
    await expect(videos).toHaveCount(3);

    // 각 비디오의 src 확인
    await expect(videos.nth(0)).toHaveAttribute("src", "/videos/1.mov");
    await expect(videos.nth(1)).toHaveAttribute("src", "/videos/2.mov");
    await expect(videos.nth(2)).toHaveAttribute("src", "/videos/3.mov");
  });

  test("bottom CTA section has sign-in buttons", async ({ page }) => {
    // 하단 CTA 섹션으로 스크롤
    await page.getByText("지금 바로 시작해보세요").scrollIntoViewIfNeeded();
    await expect(page.getByText("지금 바로 시작해보세요")).toBeVisible();
    await expect(page.getByText("카카오 · 구글 계정으로 간편하게")).toBeVisible();

    // 하단 카카오/구글 버튼
    const kakaoLink = page.getByRole("link", { name: "카카오로 시작하기" });
    const googleLink = page.getByRole("link", { name: "구글로 시작하기" });
    await expect(kakaoLink).toHaveAttribute("href", "/sign-in");
    await expect(googleLink).toHaveAttribute("href", "/sign-in");
  });

  test("header CTA click navigates to sign-in page", async ({ page }) => {
    await page.locator("header").getByRole("link", { name: "시작하기" }).click();

    await expect(page).toHaveURL(/\/sign-in/);
    await expect(page.getByText("로그인")).toBeVisible();
  });

  test("hero CTA click navigates to sign-in page", async ({ page }) => {
    await page.getByRole("link", { name: /지금 시작하기/ }).click();

    await expect(page).toHaveURL(/\/sign-in/);
  });
});
