"use client";

import MobileBlocker from "./components/MobileBlocker";
import BulkPetPageContent from "./components/BulkPetPageContent";

// BizGuard는 (브리더스룸) 레이아웃에서 이미 래핑됨 — 이 경로는 자동 isBiz 보호됨
export default function BulkPetPage() {
  return (
    <MobileBlocker>
      <BulkPetPageContent />
    </MobileBlocker>
  );
}
