import EditAdoptionModal from "@/app/(브리더스룸)/adoption/components/EditAdoptionModal";
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
  AdoptionDtoStatus,
  petControllerFindPetByPetId,
  PetDto,
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

  const refreshAndToast = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: [petControllerFindPetByPetId.name, pet.petId],
    });
    toast.success("판매 상태가 변경되었습니다.", { id: "adoption-status" });
  }, [pet.petId, queryClient]);

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
    onSuccess: refreshAndToast,
    onError: () => {
      toast.error("판매 상태 변경에 실패했습니다.");
    },
  });

  const handleCreateAdoptionModal = useCallback(
    (newStatus: AdoptionDtoStatus) => {
      overlay.open(({ isOpen, close }) => (
        <EditAdoptionModal
          isOpen={isOpen}
          onClose={close}
          pet={pet}
          status={newStatus}
          onSuccess={async () => {
            await refreshAndToast();
            close();
          }}
        />
      ));
    },
    [pet, refreshAndToast],
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
    (newStatus: AdoptionDtoStatus) => {
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
      onValueChange={(value: AdoptionDtoStatus) => onSaleStatusChange(value)}
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
