import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { DateTime } from "luxon";
import { toast } from "@/lib/toast";

interface AddMatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingDate: string;
  latestSeason?: number;
  onConfirm: (matingDate: string, season: number) => Promise<void>;
}

const AddMatingModal = ({
  isOpen,
  onClose,
  matingDate,
  latestSeason,
  onConfirm,
}: AddMatingModalProps) => {
  const [season, setSeason] = useState<number | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!season) {
      toast.error("시즌을 입력해주세요.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onConfirm(matingDate, season);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>메이팅 추가</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">메이팅 날짜</label>
            <div className="flex h-[32px] items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm dark:border-gray-700 dark:bg-gray-800">
              {DateTime.fromISO(matingDate).toFormat("yyyy년 M월 d일")}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="add-mating-season" className="text-sm font-medium">
              시즌
            </label>
            <input
              id="add-mating-season"
              type="number"
              min={1}
              className="h-[32px] w-full rounded-md border border-gray-200 p-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="몇 차"
              value={season ?? ""}
              onChange={(e) => setSeason(e.target.value ? Number(e.target.value) : undefined)}
            />
            {latestSeason != null && (
              <p className="mt-1 text-xs font-medium text-blue-600 dark:text-blue-400">
                *이 페어의 직전 시즌은 [{latestSeason}]입니다.
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? "추가 중..." : "추가"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddMatingModal;
