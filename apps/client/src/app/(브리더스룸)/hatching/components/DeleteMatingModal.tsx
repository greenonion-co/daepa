import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { brMatingControllerFindAll, matingControllerDeleteMating } from "@repo/api-client";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { CommonResponseDto } from "@repo/api-client";
import { Info } from "lucide-react";

interface DeleteMatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId: number;
  matingDate: string;
}

const DeleteMatingModal = ({ isOpen, onClose, matingId, matingDate }: DeleteMatingModalProps) => {
  const queryClient = useQueryClient();

  const { mutate: deleteMating, isPending } = useMutation({
    mutationFn: () => matingControllerDeleteMating(matingId),
    onSuccess: () => {
      toast.success("메이팅 정보가 삭제되었습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
      onClose();
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      toast.error(error.response?.data?.message ?? "메이팅 삭제에 실패했습니다.");
      onClose();
    },
  });

  const handleDelete = () => {
    deleteMating();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>메이팅 삭제</DialogTitle>
        </DialogHeader>
        <div className="space-y-1">
          <p className="text-sm text-gray-900">{matingDate} 메이팅 정보를 삭제하시겠습니까?</p>
          <p className="flex items-center gap-1 text-xs text-red-600">
            <Info className="h-4 w-4" />
            연관된 알이 있는 경우 삭제할 수 없습니다.
          </p>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending ? "삭제 중..." : "삭제"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteMatingModal;
