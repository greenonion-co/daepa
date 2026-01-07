"use client";

import {
  pairControllerGetPairList,
  LayingByDateDto,
  PetSummaryLayingDto,
  UpdatePetDto,
  petControllerDeletePet,
  petControllerUpdate,
  UpdatePetDtoEggStatus,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AxiosError } from "axios";
import React from "react";

import { overlay } from "overlay-kit";
import EditEggModal from "./EditEggModal";
import CompleteHatchingModal from "./CompleteHatchingModal";
import ConfirmDialog from "../../components/Form/Dialog";

import EggItem from "./EggItem";

interface LayingItemProps {
  layingData: LayingByDateDto;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
  showTutorial?: boolean;
}

const LayingItem = ({ layingData: { layingDate, layings }, father, mother, showTutorial }: LayingItemProps) => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateEggStatus } = useMutation({
    mutationFn: ({ eggId, data }: { eggId: string; data: UpdatePetDto }) =>
      petControllerUpdate(eggId, data),
  });

  const { mutateAsync: deleteEgg } = useMutation({
    mutationFn: (eggId: string) => petControllerDeletePet(eggId, {}),
  });

  const handleUpdate = async ({
    eggId,
    value,
  }: {
    eggId: string;
    value: UpdatePetDtoEggStatus;
  }) => {
    try {
      await updateEggStatus({
        eggId,
        data: { eggStatus: value },
      });
      toast.success("상태가 변경되었습니다.");
      await queryClient.invalidateQueries({
        queryKey: [pairControllerGetPairList.name],
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "개체 수정에 실패했습니다.");
      } else {
        toast.error("개체 수정에 실패했습니다.");
      }
    }
  };

  const handleDeleteEgg = async (eggId: string, onClose: () => void) => {
    try {
      await deleteEgg(eggId);
      await queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
      toast.success("삭제되었습니다.");
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "개체 삭제에 실패했습니다.");
      } else {
        toast.error("개체 삭제에 실패했습니다.");
      }
    }
  };

  const handleDeleteEggClick = (e: React.MouseEvent, eggId: string) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close, unmount }) => (
      <ConfirmDialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => handleDeleteEgg(eggId, close)}
        onExit={unmount}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleEditEggClick = (e: React.MouseEvent, egg: PetSummaryLayingDto) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => <EditEggModal isOpen={isOpen} onClose={close} egg={egg} />);
  };

  const handleHatching = (
    e: React.MouseEvent,
    petId: string,
    clutch?: number,
    clutchOrder?: number,
  ) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <CompleteHatchingModal
        isOpen={isOpen}
        onClose={close}
        petId={petId}
        layingDate={layingDate}
        clutch={clutch}
        clutchOrder={clutchOrder}
        fatherName={father?.name}
        motherName={mother?.name}
      />
    ));
  };

  return (
    <div className="flex flex-col">
      {layings.map((pet, index) => (
        <EggItem
          key={pet.petId}
          pet={pet}
          layingDate={layingDate}
          handleHatching={(e) => handleHatching(e, pet.petId, pet.clutch, pet.clutchOrder)}
          handleDeleteEggClick={(e) => handleDeleteEggClick(e, pet.petId)}
          handleEditEggClick={(e) => handleEditEggClick(e, pet)}
          handleUpdate={(value) =>
            handleUpdate({
              eggId: pet.petId,
              value,
            })
          }
          showTutorial={index === 0 && showTutorial}
        />
      ))}
    </div>
  );
};

export default LayingItem;
