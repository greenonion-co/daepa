import { Button } from "@/components/ui/button";
import { Edit3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import Dialog from "@/app/(브리더스룸)/components/Form/Dialog";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { memo, useCallback } from "react";
import { petControllerDeletePet } from "@repo/api-client";
import { AxiosError } from "axios";

interface CardBackActionsProps {
  petId: string;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onCancel: () => void;
}

const CardBackActions = memo(
  ({ petId, isEditing, onEditToggle, onSave, onCancel }: CardBackActionsProps) => {
    const router = useRouter();

    const { mutateAsync: mutateDeletePet } = useMutation({
      mutationFn: (petId: string) => petControllerDeletePet(petId),
    });

    const handleConfirmDelete = useCallback(
      async (close: () => void) => {
        try {
          await mutateDeletePet(petId);
          router.back();
          toast.success("펫이 삭제되었습니다.");
          close();
        } catch (error) {
          if (error instanceof AxiosError) {
            toast.error(error.response?.data?.message ?? "펫 삭제에 실패했습니다.");
          } else {
            toast.error("펫 삭제에 실패했습니다.");
          }
        }
      },
      [petId, mutateDeletePet, router],
    );

    const handleDelete = useCallback(() => {
      overlay.open(({ isOpen, close, unmount }) => (
        <Dialog
          isOpen={isOpen}
          onCloseAction={close}
          onConfirmAction={() => handleConfirmDelete(close)}
          onExit={unmount}
          title="개체 삭제 안내"
          description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
        />
      ));
    }, [handleConfirmDelete]);

    const handleEditClick = useCallback(() => {
      onEditToggle();
    }, [onEditToggle]);

    const handleSaveClick = useCallback(() => {
      onSave();
    }, [onSave]);

    const handleCancelClick = useCallback(() => {
      onCancel();
    }, [onCancel]);

    return (
      <div
        className={cn(
          "sticky bottom-0 left-0 flex p-4",
          isEditing ? "justify-end" : "justify-between",
        )}
      >
        {isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" className="h-8 rounded-xl" onClick={handleCancelClick}>
              취소
            </Button>
            <Button className="h-8 rounded-xl bg-[#1A56B3]" onClick={handleSaveClick}>
              저장하기
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 justify-between">
            <Button variant="destructive" size="sm" onClick={handleDelete} className="text-white">
              삭제하기
            </Button>

            <div className="flex justify-end dark:bg-[#18181B]">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleEditClick}>
                <Edit3 />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  },
);

CardBackActions.displayName = "CardBackActions";

export default CardBackActions;
