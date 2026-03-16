"use client";

import { ChevronLeft } from "lucide-react";
import { useAppRouter } from "@/hooks/useAppRouter";
import { isNativeApp } from "@/lib/native-bridge";

interface WebViewTopBarProps {
  title?: string;
  rightComponent?: React.ReactNode;
}

/**
 * 네이티브 앱 WebView 환경에서만 표시되는 TopBar.
 * 네이티브 TopBar를 숨기고(_hideTopBar=1) 이 컴포넌트를 사용하면
 * 웹 자체의 뒤로가기가 동작합니다.
 *
 * UI는 apps/mobile TopBar.tsx와 동일한 구조:
 * 높이 56px, 좌측 60px(ChevronLeft), 가운데 타이틀(18px/600), 우측 60px
 */
export default function WebViewTopBar({ title, rightComponent }: WebViewTopBarProps) {
  const router = useAppRouter();

  if (!isNativeApp()) return null;

  return (
    <div className="flex h-14 w-full items-center bg-white px-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex w-[60px] items-start">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-900 dark:text-gray-100"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      </div>
      <div className="flex flex-1 items-center justify-center">
        {title && (
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</span>
        )}
      </div>
      <div className="flex w-[60px] items-center justify-end">{rightComponent}</div>
    </div>
  );
}
