import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UpdateParentRequestDtoStatus } from "@repo/api-client";
import { useState } from "react";

interface RejectModalProps {
  isOpen: boolean;
  close: () => void;
  handleUpdate: (status: UpdateParentRequestDtoStatus, rejectReason?: string) => void;
}

const RejectModal = ({ isOpen, close, handleUpdate }: RejectModalProps) => {
  const [rejectReason, setRejectReason] = useState("");

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>요청 거절</DialogTitle>
        </DialogHeader>

        <div className="relative flex flex-col gap-2">
          <p className="text-sm font-semibold text-gray-800">요청을 거절하시겠습니까?</p>
          <textarea
            className={`min-h-[160px] w-full rounded-xl bg-gray-100 p-4 text-left text-[18px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
            value={rejectReason ?? ""}
            maxLength={300}
            onChange={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setRejectReason(e.target.value);
            }}
            style={{ height: "auto" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = `${target.scrollHeight}px`;
            }}
          />

          <div className="absolute bottom-4 right-4 text-sm text-gray-500">
            {rejectReason.length}/300
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              handleUpdate(UpdateParentRequestDtoStatus.REJECTED, rejectReason);
              close();
            }}
          >
            거절
          </Button>
          <Button variant="outline" onClick={close}>
            취소
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RejectModal;
