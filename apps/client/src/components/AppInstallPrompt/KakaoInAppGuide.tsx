"use client";

import { X } from "lucide-react";

interface KakaoInAppGuideProps {
  isIOS: boolean;
  onDismiss: () => void;
}

/**
 * 카카오톡/인스타/페북 등 인앱 브라우저는 Universal Link / App Link를 차단한다.
 * 외부 브라우저(Safari / Chrome)로 이동해야 앱이 정상 실행된다.
 */
export function KakaoInAppGuide({ isIOS, onDismiss }: KakaoInAppGuideProps) {
  const browserName = isIOS ? "Safari" : "Chrome";
  return (
    <div className="flex items-start gap-3 bg-amber-50 px-4 py-3 text-amber-900 border-b border-amber-200">
      <div className="flex-1 min-w-0 text-xs leading-relaxed">
        <strong className="block font-semibold mb-0.5">
          앱이 설치돼 있는데 안 열리나요?
        </strong>
        우측 상단 메뉴(⋮)에서 &quot;{browserName}로 열기&quot;를 선택하면
        BREEDY 앱이 자동으로 실행됩니다.
      </div>
      <button
        type="button"
        aria-label="안내 닫기"
        onClick={onDismiss}
        className="text-amber-700 hover:text-amber-900 flex-shrink-0"
      >
        <X size={18} />
      </button>
    </div>
  );
}
