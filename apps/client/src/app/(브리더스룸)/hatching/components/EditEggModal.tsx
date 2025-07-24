import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  eggControllerUpdate,
  LayingDto,
  matingControllerFindAll,
  UpdateEggDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const EditEggModal = ({
  isOpen,
  egg,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
  egg: LayingDto;
}) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<{
    temperature: string;
  }>({
    temperature: "25",
  });

  const { mutate: updateEgg } = useMutation({
    mutationFn: (data: UpdateEggDto) => eggControllerUpdate(egg.eggId, data),
    onSuccess: () => {
      toast.success("알 수정 완료");
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
      onClose();
    },
    onError: () => {
      toast.error("알 수정 실패");
    },
  });

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
          <Button onClick={() => updateEgg({ temperature: parseFloat(formData.temperature) })}>
            수정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditEggModal;
