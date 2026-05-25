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
}: CreateAuctionDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] w-full overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>경매 정보 설정</DialogTitle>
        </DialogHeader>
        <CreateAuctionForm
          initialPetId={initialPetId}
          lockPetId={lockPetId}
          pendingPet={pendingPet}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
