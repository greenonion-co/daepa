import { defineConfig, devices } from "@playwright/test";

/**
 * Production 헬스 체크 전용 설정
 * webServer 없이 실제 production URL에 직접 접속
 */
export default defineConfig({
  testDir: "./e2e",
  testMatch: "production.spec.ts",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: process.env.PRODUCTION_URL || "https://breedy.kr",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // webServer 없음 — production 사이트에 직접 접속
});
