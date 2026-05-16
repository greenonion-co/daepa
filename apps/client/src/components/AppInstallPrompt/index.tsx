"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { detectClientEnv } from "@/lib/userAgent";
import {
  dismissBanner,
  dismissBottomSheet,
  dismissKakaoGuide,
  isBannerDismissed,
  isBottomSheetDismissed,
  isKakaoGuideDismissed,
} from "@/lib/appPromptStorage";

import { Banner } from "./Banner";
import { BottomSheet } from "./BottomSheet";
import { KakaoInAppGuide } from "./KakaoInAppGuide";
import {
  APP_STORE_URL,
  PLAY_STORE_URL,
  buildAndroidIntentUrl,
} from "./storeLinks";

const EXCLUDED_PATH_PREFIXES = [
  "/intro",
  "/privacy",
  "/auth-callback",
  "/api",
];

type PromptVariant = "banner" | "bottomSheet" | "kakaoGuide" | null;

export function AppInstallPrompt() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<PromptVariant>(null);

  // SSR/CSR hydration mismatch 방지: 마운트 후에만 감지
  useEffect(() => {
    setMounted(true);
  }, []);

  const env = useMemo(() => (mounted ? detectClientEnv() : null), [mounted]);

  const fromShare = searchParams?.get("ref") === "share";
  const isExcludedPath = EXCLUDED_PATH_PREFIXES.some((p) =>
    (pathname ?? "").startsWith(p)
  );

  useEffect(() => {
    if (!env) return;
    if (env.isInApp || env.isDesktop || isExcludedPath) {
      setVariant(null);
      return;
    }

    // 인앱 브라우저(카톡 등): 외부 브라우저 이동 안내
    if (env.isInAppBrowser) {
      if (isKakaoGuideDismissed()) {
        setVariant(null);
      } else {
        setVariant("kakaoGuide");
      }
      return;
    }

    // 공유 진입: 인터스티셜 모달 (세션 1회)
    if (fromShare && !isBottomSheetDismissed()) {
      setVariant("bottomSheet");
      return;
    }

    // 일반 진입: 상단 배너 (7일)
    if (!isBannerDismissed()) {
      setVariant("banner");
      return;
    }

    setVariant(null);
  }, [env, fromShare, isExcludedPath]);

  if (!env || !variant) return null;

  const handleOpenApp = () => {
    const targetPath = pathname ?? "/";
    if (env.isAndroid) {
      // Android: 인텐트 URL로 시도 → 앱 없으면 Play Store 폴백
      window.location.href = buildAndroidIntentUrl(targetPath);
      return;
    }
    if (env.isIOS) {
      // iOS는 인앱 브라우저가 아니어도 이미 Universal Link을 시도했을 가능성이 높음.
      // 여기 도달했다는 건 앱 미설치 → 앱스토어 직행.
      window.location.href = APP_STORE_URL;
      return;
    }
    // 그 외 모바일은 도메인 추측 불가 → 두 스토어 모두 제공할 수 있겠지만 일단 Android 폴백
    window.location.href = PLAY_STORE_URL;
  };

  if (variant === "kakaoGuide") {
    return (
      <KakaoInAppGuide
        isIOS={env.isIOS}
        onDismiss={() => {
          dismissKakaoGuide();
          setVariant(null);
        }}
      />
    );
  }

  if (variant === "bottomSheet") {
    return (
      <BottomSheet
        onOpenApp={() => {
          dismissBottomSheet();
          handleOpenApp();
        }}
        onContinueWeb={() => {
          dismissBottomSheet();
          setVariant(null);
        }}
      />
    );
  }

  return (
    <Banner
      onOpenApp={handleOpenApp}
      onDismiss={() => {
        dismissBanner();
        setVariant(null);
      }}
    />
  );
}
