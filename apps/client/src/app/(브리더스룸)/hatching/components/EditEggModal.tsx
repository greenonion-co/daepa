import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  brMatingControllerFindAll,
  petControllerUpdate,
  PetSummaryLayingDto,
  UpdatePetDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useState } from "react";
import { toast } from "sonner";

const EditEggModal = ({
  isOpen,
  egg,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  egg: PetSummaryLayingDto;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    temperature: string;
  }>({
    temperature: egg.temperature?.toString() ?? "25",
  });

  const { mutateAsync: updateEgg } = useMutation({
    mutationFn: (data: UpdatePetDto) => petControllerUpdate(egg.petId, data),
  });

  const handleSubmit = async () => {
    const temp = parseFloat(formData.temperature);
    if (isNaN(temp)) {
      toast.error("올바른 온도를 입력해주세요.");
      return;
    }
    try {
      const { data } = await updateEgg({ temperature: temp });
      toast.success(data.message ?? "알 수정 완료");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "알 수정 실패");
      } else {
        toast.error("알 수정 실패");
      }
    } finally {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>알 수정</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="temperature">온도</Label>
          <Input
            id="temperature"
            type="number"
            step="0.1"
            placeholder="온도를 입력하세요"
            value={formData.temperature}
            onChange={(e) => setFormData((prev) => ({ ...prev, temperature: e.target.value }))}
            className="col-span-3"
          />
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSubmit}>수정</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEggModal;
