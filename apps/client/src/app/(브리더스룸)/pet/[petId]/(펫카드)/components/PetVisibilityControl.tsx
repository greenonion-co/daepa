import Dialog from "@/app/(브리더스룸)/components/Form/Dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { petControllerFindPetByPetId, petControllerUpdate, UpdatePetDto } from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { overlay } from "overlay-kit";
import { memo, useCallback } from "react";
import { toast } from "sonner";

interface PetVisibilityControlProps {
  petId: string;
  isPublic?: boolean;
}
const PetVisibilityControl = memo(({ petId, isPublic = false }: PetVisibilityControlProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync: updatePet } = useMutation({
    mutationFn: (data: UpdatePetDto) => petControllerUpdate(petId, data),
  });

  const handleUpdatePet = useCallback(
    async (newIsPublic: boolean) => {
      try {
        await updatePet({ isPublic: newIsPublic } as UpdatePetDto);
        queryClient.invalidateQueries({
          queryKey: [petControllerFindPetByPetId.name, petId],
        });
        toast.success("펫 정보가 변경되었습니다.");
      } catch (error) {
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "펫 정보 수정에 실패했습니다.");
        } else {
          toast.error("펫 정보 수정에 실패했습니다.");
        }
      }
    },
    [updatePet, queryClient, petId],
  );

  const onPublicChange = useCallback(() => {
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          handleUpdatePet(!isPublic);
          close();
        }}
        onExit={unmount}
        title="펫 공개 여부 변경"
        description="펫 공개 여부를 변경하시겠습니까?"
      />
    ));
  }, [isPublic, handleUpdatePet]);

  return (
    <div className="flex gap-2">
      <Switch
        id="visibility"
        className="data-[state=checked]:bg-blue-600"
        checked={isPublic}
        onCheckedChange={onPublicChange}
      />
      <Label htmlFor="visibility" className="text-muted-foreground text-sm">
        다른 브리더에게 공개
      </Label>
    </div>
  );
});

PetVisibilityControl.displayName = "PetVisibilityControl";

export default PetVisibilityControl;
