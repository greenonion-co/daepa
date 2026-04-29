"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CreateAuctionForm } from "./CreateAuctionForm";

interface CreateAuctionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** 폼에 prefill 할 펫 ID (펫 상세에서 띄울 때 사용) */
  initialPetId?: string;
  /** true 면 펫 ID 인풋 잠금 */
  lockPetId?: boolean;
}

export default function CreateAuctionDialog({
  isOpen,
  onClose,
  initialPetId,
  lockPetId,
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
          <DialogTitle>경매 설정</DialogTitle>
        </DialogHeader>
        <CreateAuctionForm initialPetId={initialPetId} lockPetId={lockPetId} onClose={onClose} />
      </DialogContent>
    </Dialog>
  );
}
