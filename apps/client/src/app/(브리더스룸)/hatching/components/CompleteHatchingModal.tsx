import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  brMatingControllerFindAll,
  CompleteHatchingDto,
  petControllerCompleteHatching,
} from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { useState } from "react";
import { format, isBefore } from "date-fns";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import NameInput from "../../components/NameInput";
import { cn } from "@/lib/utils";
import { useNameStore } from "../../store/name";
import { DUPLICATE_CHECK_STATUS } from "../../register/types";
import CalendarSelect from "./CalendarSelect";

interface CompleteHatchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  petId: string;
  layingDate: string;
}

const CompleteHatchingModal = ({
  isOpen,
  onClose,
  petId,
  layingDate,
}: CompleteHatchingModalProps) => {
  const queryClient = useQueryClient();
  const { duplicateCheckStatus } = useNameStore();
  const [formData, setFormData] = useState<CompleteHatchingDto>({
    hatchingDate: format(new Date(), "yyyy-MM-dd"),
    name: "",
    desc: "",
  });

  const { mutateAsync: mutateHatched } = useMutation({
    mutationFn: (formData: CompleteHatchingDto) => petControllerCompleteHatching(petId, formData),
  });

  const handleSubmit = async () => {
    if (!formData.hatchingDate) {
      toast.error("해칭일을 선택해주세요.");
      return;
    }

    if (!formData.name || duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
      toast.error("이름을 입력하고 중복확인을 완료해주세요.");

      return;
    }

    try {
      const { data } = await mutateHatched(formData);

      if (data?.success) {
        toast.success("해칭 완료");
        queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
        onClose();
      }
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("해칭에 실패했습니다.");
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>해칭 완료</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label>해칭일*</Label>
            <div className="col-span-3">
              <CalendarSelect
                type="edit"
                triggerText={
                  formData.hatchingDate
                    ? format(new Date(formData.hatchingDate), "yyyy-MM-dd")
                    : "해칭일"
                }
                onConfirm={(date) => {
                  if (!date) return;
                  setFormData((prev) => ({ ...prev, hatchingDate: format(date, "yyyy-MM-dd") }));
                }}
                initialDate={formData.hatchingDate}
                disabled={(date) => isBefore(date, new Date(layingDate))}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">이름*</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <NameInput
                value={formData.name}
                placeholder="이름을 입력하세요"
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className={cn(
                  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input shadow-xs flex h-10 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base outline-none transition-[color,box-shadow] file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
                  "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
                )}
                buttonClassName="h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="clutch">메모</Label>
            <div className="col-span-3 flex flex-col gap-1">
              <Textarea
                id="desc"
                placeholder="메모를 입력하세요"
                value={formData.desc}
                onChange={(e) => setFormData((prev) => ({ ...prev, desc: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>해칭 완료</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteHatchingModal;
