"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PetDto, brPetControllerFindAll } from "@repo/api-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PetDetailLayout from "./PetDetailLayout";
import BreedingInfoContent from "./BreedingInfoContent";
import ImagesContent from "./ImagesContent";
import PedigreeInfoContent from "./PedigreeInfoContent";
import AdoptionInfoContent from "./AdoptionInfoContent";
import FeedingInfoContent from "./FeedingInfoContent";
import { useFlush } from "./FlushContext";

interface PetDetailModalProps {
  isOpen: boolean;
  pet: PetDto;
  onClose: () => void;
}

export default function PetDetailModal({ isOpen, pet, onClose }: PetDetailModalProps) {
  const queryClient = useQueryClient();
  const { flushRef, flushAll, FlushProvider } = useFlush();

  const handleClose = useCallback(() => {
    onClose();
    flushAll().then(() => {
      queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });
    });
  }, [flushAll, onClose, queryClient]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pt-[16px] pb-0 sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl dark:bg-neutral-800">
        <DialogTitle className="sr-only">펫 상세 정보</DialogTitle>
        <FlushProvider value={flushRef}>
          <PetDetailLayout
            variant="modal"
            pet={pet}
            onDelete={handleClose}
            breedingSlot={
              <BreedingInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                initialPet={pet}
              />
            }
            imagesSlot={<ImagesContent pet={pet} initialImages={[]} />}
            pedigreeSlot={
              <PedigreeInfoContent
                species={pet.species}
                petId={pet.petId}
                userId={pet.owner.userId ?? ""}
                initialParents={null}
              />
            }
            adoptionSlot={
              <AdoptionInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                initialAdoption={null}
                onClose={handleClose}
              />
            }
            feedingSlot={
              <FeedingInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                defaultFoods={pet.foods}
              />
            }
          />
        </FlushProvider>
      </DialogContent>
    </Dialog>
  );
}
