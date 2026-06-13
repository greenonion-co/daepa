"use client";

import { ChevronRight, PawPrint, PlusCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CreateAuctionChooserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting: () => void;
  onCreateNew: () => void;
}

export default function CreateAuctionChooserDialog({
  isOpen,
  onClose,
  onSelectExisting,
  onCreateNew,
}: CreateAuctionChooserDialogProps) {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {/* 우측 상단 닫기 버튼이 있으므로 백그라운드 오터치 닫힘 방지 (경매 생성 흐름 공통) */}
      <DialogContent
        className="w-[calc(100%-2rem)] sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>경매를 어떻게 시작할까요?</DialogTitle>
        </DialogHeader>
        <div className="mt-2 flex flex-col gap-2">
          <button
            type="button"
            onClick={onSelectExisting}
            className="focus-visible:ring-ring flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <PawPrint className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">기존 개체에서 선택</span>
              <span className="text-muted-foreground text-xs">
                보유 중인 개체 중에서 골라 경매를 시작합니다.
              </span>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
          </button>

          <button
            type="button"
            onClick={onCreateNew}
            className="focus-visible:ring-ring flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4 text-left transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:outline-none dark:border-gray-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
          >
            <PlusCircle className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="flex flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">새 개체 추가 후 경매</span>
              <span className="text-muted-foreground text-xs">
                새 개체를 등록한 뒤 바로 경매를 시작합니다.
              </span>
            </div>
            <ChevronRight className="text-muted-foreground h-5 w-5 shrink-0" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
