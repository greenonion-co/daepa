"use client";

import { type CreatePetDto } from "@repo/api-client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateAuctionForm } from "./CreateAuctionForm";

interface CreateAuctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** 폼에 prefill 할 펫 ID (펫 상세에서 띄울 때 사용) */
  initialPetId?: string;
  /** true 면 펫 ID 인풋 잠금 */
  lockPetId?: boolean;
  /** 제공되면 '이전' 버튼을 표시하고 클릭 시 호출 (직전 단계로 복귀). */
  onBack?: () => void;
  /**
   * 제공되면 폼 제출 시 이 DTO 로 펫을 먼저 생성한 후 그 petId 로 경매를 만든다.
   * 경매 생성 흐름에서 "새 개체 추가 후 경매" 를 선택했을 때 사용.
   */
  pendingPet?: CreatePetDto;
}

export default function CreateAuctionDialog({
  isOpen,
  onClose,
  initialPetId,
  lockPetId,
  pendingPet,
  onBack,
}: CreateAuctionDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* 우측 상단 닫기 버튼이 있으므로 백그라운드 오터치로 인한 의도치 않은 닫힘 방지 */}
      <DialogContent
        className="max-h-[90dvh] w-full overflow-y-auto sm:max-w-lg"
        preventOutsideClose
      >
        <DialogHeader>
          <DialogTitle>경매 정보 설정</DialogTitle>
        </DialogHeader>
        <CreateAuctionForm
          initialPetId={initialPetId}
          lockPetId={lockPetId}
          pendingPet={pendingPet}
          onClose={onClose}
          onBack={onBack}
        />
      </DialogContent>
    </Dialog>
  );
}
