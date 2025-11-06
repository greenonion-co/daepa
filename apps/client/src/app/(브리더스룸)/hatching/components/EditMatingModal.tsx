import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { brMatingControllerFindAll, matingControllerUpdateMating } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { UpdateMatingDto } from "@repo/api-client";
import CalendarInput from "./CalendarInput";
import { format } from "date-fns";

interface EditMatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  currentData: {
    fatherId?: string;
    motherId?: string;
    matingDate: string;
  };
  matingDates?: string[];
}

const EditMatingModal = ({
  isOpen,
  onClose,
  matingId,
  currentData,
  matingDates,
}: EditMatingModalProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    fatherId: currentData.fatherId || "",
    motherId: currentData.motherId || "",
    matingDate: currentData.matingDate,
  });

  const { mutateAsync: updateMating, isPending } = useMutation({
    mutationFn: (data: UpdateMatingDto) => matingControllerUpdateMating(matingId, data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await updateMating({
        fatherId: formData.fatherId || undefined,
        motherId: formData.motherId || undefined,
        matingDate: formData.matingDate,
      });

      toast.success("메이팅 정보가 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "메이팅 수정에 실패했습니다.");
      } else {
        toast.error("메이팅 수정에 실패했습니다.");
      }
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>메이팅 정보 수정</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="matingDate">메이팅 날짜</Label>
            <CalendarInput
              placeholder="메이팅 날짜를 선택하세요"
              value={formData.matingDate}
              onSelect={(date) => {
                if (!date) return;

                const dateString = format(date, "yyyyMMdd");
                const matingDateStrings = matingDates?.map((d) => format(d, "yyyyMMdd")) ?? [];

                if (matingDateStrings.includes(dateString)) {
                  toast.error("이미 메이팅이 등록된 날짜입니다.");
                  return;
                }
                setFormData((prev) => ({ ...prev, matingDate: format(date, "yyyy-MM-dd") }));
              }}
              modifiers={{
                hasMating: matingDates?.map((d) => new Date(d)) ?? [],
              }}
              modifiersStyles={{
                hasMating: {
                  backgroundColor: "#fef3c7",
                  color: "#92400e",
                  fontWeight: "bold",
                },
              }}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600"
              disabled={isPending}
            >
              {isPending ? "수정 중..." : "수정"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMatingModal;
