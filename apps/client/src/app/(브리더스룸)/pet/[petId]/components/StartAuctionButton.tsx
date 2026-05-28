"use client";

import dynamic from "next/dynamic";
import { overlay } from "overlay-kit";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "@/lib/toast";
import { useBreedingInfoStore } from "../../store/breedingInfo";

// 모달 컴포넌트는 버튼 클릭 시점에만 chunk 로드 → 펫 상세 진입 번들 부담 없음
const CreateAuctionDialog = dynamic(() => import("@/app/auction/components/CreateAuctionDialog"), {
  ssr: false,
});

interface StartAuctionButtonProps {
  petId: string;
  /** 초기/fallback isPublic 값. 변경은 useBreedingInfoStore 에서 즉시 반영. */
  isPublic: boolean;
}

// 활성 상태: amber 배경 + 흰색 텍스트 + shine 애니메이션 (globals.css 의 breeder-badge-shine 재활용)
const ACTIVE_CLASS =
  "rounded-lg bg-amber-600 text-white hover:bg-amber-700 max-[580px]:w-full dark:bg-amber-500 dark:hover:bg-amber-600 breeder-badge-shine";

// 비활성 상태: 같은 색 톤 유지하되 opacity 로 비활성 표현. shine 은 제거.
const DISABLED_CLASS =
  "rounded-lg bg-amber-600 text-white opacity-50 cursor-not-allowed hover:bg-amber-600 max-[580px]:w-full dark:bg-amber-500 dark:hover:bg-amber-500";

const PRIVATE_NOTICE =
  "비공개 개체는 경매를 시작할 수 없습니다. 개체를 공개로 전환한 뒤 다시 시도해 주세요.";

export default function StartAuctionButton({
  petId,
  isPublic: initialIsPublic,
}: StartAuctionButtonProps) {
  // BreedingInfoContent 가 isPublic 토글 시점에 setBreedingInfo 로 즉시 갱신.
  // 같은 petId 일 때만 store 값을 신뢰하고, 아니면 prop 의 initial 값을 사용.
  const liveIsPublic = useBreedingInfoStore((s) =>
    s.breedingInfo.petId === petId ? s.breedingInfo.isPublic : undefined,
  );
  const isPublic = typeof liveIsPublic === "boolean" ? liveIsPublic : initialIsPublic;

  const openCreateModal = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <CreateAuctionDialog
        isOpen={isOpen}
        onClose={() => {
          close();
          // overlay-kit 권장 패턴: close 후 unmount 로 메모리 정리
          setTimeout(unmount, 200);
        }}
        initialPetId={petId}
        lockPetId
      />
    ));
  };

  if (!isPublic) {
    // 모바일/웹뷰는 hover 가 없어 Tooltip 이 안 뜸 → click 시 toast 로 안내.
    // 데스크탑에선 Tooltip 도 hover 로 동시에 보여줌.
    // disabled 대신 aria-disabled + 클릭 시 toast 로 처리해서 터치/마우스 모두 동작.
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            className={DISABLED_CLASS}
            aria-disabled="true"
            onClick={() => toast.info(PRIVATE_NOTICE)}
          >
            개체 경매
          </Button>
        </TooltipTrigger>
        <TooltipContent>{PRIVATE_NOTICE}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Button size="sm" className={ACTIVE_CLASS} onClick={openCreateModal}>
      개체 경매
    </Button>
  );
}
