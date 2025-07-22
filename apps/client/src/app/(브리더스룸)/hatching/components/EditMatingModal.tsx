import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { matingControllerUpdateMating } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { CommonResponseDto, UpdateMatingDto } from "@repo/api-client";
import { formatDateToYYYYMMDDString } from "@/lib/utils";
import CalendarInput from "./CalendarInput";
import { format } from "date-fns";

interface EditMatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  currentData: {
    fatherId?: string;
    motherId?: string;
    matingDate: number;
  };
  matingDates?: Date[];
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
    matingDate: formatDateToYYYYMMDDString(currentData.matingDate, "yyyy-MM-dd"),
  });

  const { mutate: updateMating, isPending } = useMutation({
    mutationFn: (data: UpdateMatingDto) => matingControllerUpdateMating(matingId, data),
    onSuccess: () => {
      toast.success("메이팅 정보가 수정되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["matingControllerFindAll"] });
      onClose();
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 수정에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const matingDate = parseInt(formData.matingDate.replace(/-/g, ""), 10);

    updateMating({
      fatherId: formData.fatherId || undefined,
      motherId: formData.motherId || undefined,
      matingDate,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
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
                hasMating: matingDates ?? [],
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
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "수정 중..." : "수정"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditMatingModal;
