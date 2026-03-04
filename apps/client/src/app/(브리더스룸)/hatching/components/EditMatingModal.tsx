import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { useMutation } from "@tanstack/react-query";
import { matingControllerUpdateMating } from "@repo/api-client";
import { usePairInvalidate } from "../hooks/usePairInvalidate";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";
import { UpdateMatingDto } from "@repo/api-client";
import CalendarInput from "./CalendarInput";
import { DateTime } from "luxon";

interface EditMatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  currentData: {
    fatherId?: string;
    motherId?: string;
    matingDate: string;
    season: number;
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
  const invalidatePair = usePairInvalidate();
  const [formData, setFormData] = useState<{
    fatherId: string;
    motherId: string;
    matingDate: string;
    season: number | undefined;
  }>({
    fatherId: currentData.fatherId || "",
    motherId: currentData.motherId || "",
    matingDate: currentData.matingDate,
    season: currentData.season,
  });

  const { mutateAsync: updateMating, isPending } = useMutation({
    mutationFn: (data: UpdateMatingDto) => matingControllerUpdateMating(matingId, data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.season || formData.season < 1) {
      toast.error("시즌은 1 이상이어야 합니다.");
      return;
    }

    try {
      await updateMating({
        fatherId: formData.fatherId || undefined,
        motherId: formData.motherId || undefined,
        matingDate: formData.matingDate,
        season: formData.season!,
      });

      toast.success("메이팅 정보가 수정되었습니다.");
      invalidatePair();
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

                const dateString = DateTime.fromJSDate(date).toFormat("yyyyMMdd");
                const matingDateStrings =
                  matingDates?.map((d) => DateTime.fromJSDate(new Date(d)).toFormat("yyyyMMdd")) ??
                  [];

                if (matingDateStrings.includes(dateString)) {
                  toast.error("이미 메이팅이 등록된 날짜입니다.");
                  return;
                }
                setFormData((prev) => ({
                  ...prev,
                  matingDate: DateTime.fromJSDate(date).toFormat("yyyy-MM-dd"),
                }));
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

          <div className="space-y-2">
            <Label htmlFor="season">시즌 (몇 차)</Label>
            <input
              id="season"
              type="number"
              min={1}
              className="h-[32px] w-full rounded-md border border-gray-200 p-2 text-sm"
              placeholder="시즌을 입력해주세요"
              value={formData.season ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  season: e.target.value ? Number(e.target.value) : undefined,
                }))
              }
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
