import CreateAdoptionModal from "@/app/(브리더스룸)/adoption/components/CreateAdoptionModal";
import Dialog from "@/app/(브리더스룸)/components/Form/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adoptionControllerCreateAdoption,
  adoptionControllerUpdate,
  petControllerFindOne,
  PetDto,
  PetDtoSaleStatus,
  UpdateAdoptionDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { overlay } from "overlay-kit";
import { memo, useCallback } from "react";
import { toast } from "sonner";

interface AdoptionStatusControlProps {
  pet: PetDto;
}
const AdoptionStatusControl = memo(({ pet }: AdoptionStatusControlProps) => {
  const queryClient = useQueryClient();
  const { mutate: updateAdoption } = useMutation({
    mutationFn: async (data: UpdateAdoptionDto) => {
      if (!pet?.adoption?.adoptionId) {
        return adoptionControllerCreateAdoption({
          ...data,
          petId: pet.petId,
        });
      } else {
        return adoptionControllerUpdate(pet?.adoption?.adoptionId, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [petControllerFindOne.name, pet.petId],
      });
      toast.success("판매 상태가 변경되었습니다.");
    },
    onError: () => {
      toast.error("판매 상태 변경에 실패했습니다.");
    },
  });

  const handleSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: [petControllerFindOne.name, pet.petId],
    });
    toast.success("판매 상태가 변경되었습니다.");
  }, [queryClient, pet.petId]);

  const handleCreateAdoptionModal = useCallback(
    (newStatus: string) => {
      overlay.open(({ isOpen, close }) => (
        <CreateAdoptionModal
          isOpen={isOpen}
          onClose={close}
          pet={pet}
          status={newStatus as PetDtoSaleStatus}
          onSuccess={handleSuccess}
        />
      ));
    },
    [pet, handleSuccess],
  );

  const handleStatusChangeDialog = useCallback(
    (newStatus: string) => {
      overlay.open(({ isOpen, close, unmount }) => (
        <Dialog
          isOpen={isOpen}
          onCloseAction={close}
          onConfirmAction={() => {
            updateAdoption({ status: newStatus } as UpdateAdoptionDto);
            close();
          }}
          onExit={unmount}
          title="판매 상태 변경"
          description="판매 상태를 변경하시겠습니까?"
        />
      ));
    },
    [updateAdoption],
  );

  const onSaleStatusChange = useCallback(
    (newStatus: string) => {
      if (["ON_SALE", "ON_RESERVATION", "SOLD"].includes(newStatus)) {
        handleCreateAdoptionModal(newStatus);
      } else {
        handleStatusChangeDialog(newStatus);
      }
    },
    [handleCreateAdoptionModal, handleStatusChangeDialog],
  );

  return (
    <Select
      value={pet?.adoption?.status || "UNDEFINED"}
      onValueChange={(value) => onSaleStatusChange(value)}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="UNDEFINED" disabled>
          미정
        </SelectItem>
        <SelectItem value="NFS">판매 안함</SelectItem>
        <SelectItem value="ON_SALE">판매 중</SelectItem>
        <SelectItem value="ON_RESERVATION">예약 중</SelectItem>
        <SelectItem value="SOLD">판매 완료</SelectItem>
      </SelectContent>
    </Select>
  );
});

AdoptionStatusControl.displayName = "AdoptionStatusControl";

export default AdoptionStatusControl;
