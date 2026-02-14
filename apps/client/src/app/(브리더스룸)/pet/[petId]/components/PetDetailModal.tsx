"use client";

import { PetDto } from "@repo/api-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PetDetailLayout from "./PetDetailLayout";
import BreedingInfoContent from "./BreedingInfoContent";
import ImagesContent from "./ImagesContent";
import PedigreeInfoContent from "./PedigreeInfoContent";
import AdoptionInfoContent from "./AdoptionInfoContent";
import FeedingInfoContent from "./FeedingInfoContent";

interface PetDetailModalProps {
  isOpen: boolean;
  pet: PetDto;
  onClose: () => void;
}

export default function PetDetailModal({ isOpen, pet, onClose }: PetDetailModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pt-[16px] pb-0 sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl dark:bg-neutral-800">
        <DialogTitle className="sr-only">펫 상세 정보</DialogTitle>
        <PetDetailLayout
          variant="modal"
          pet={pet}
          onDelete={onClose}
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
              onClose={onClose}
            />
          }
          feedingSlot={
            <FeedingInfoContent petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
          }
        />
      </DialogContent>
    </Dialog>
  );
}
