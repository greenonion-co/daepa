"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import {
  PetDto,
  PetAdoptionDto,
  PetImageItem,
  GetParentsByPetIdResponseDtoData,
} from "@repo/api-client";

import "swiper/css";
import "swiper/css/pagination";
import Header from "./Header";
import ImagesContent from "./ImagesContent";
import BreedingInfoContent from "./BreedingInfoContent";
import PedigreeInfoContent from "./PedigreeInfoContent";
import AdoptionInfoContent from "./AdoptionInfoContent";

interface PetModalWrapperProps {
  pet: PetDto;
  initialImages: PetImageItem[];
  initialParents: GetParentsByPetIdResponseDtoData | null;
  initialAdoption: PetAdoptionDto | null;
}

export default function PetModalWrapper({
  pet,
  initialImages,
  initialParents,
  initialAdoption,
}: PetModalWrapperProps) {
  const router = useRouter();

  const handleClose = () => {
    // 새로고침으로 접근한 경우 /pet으로 이동
    router.push("/pet");
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pb-0 pt-[16px] sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-1 flex-col">
            <Header pet={pet} size="small" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
          <div className="space-y-2 sm:flex sm:gap-2 sm:space-y-0">
            {/* 이미지 캐러셀 */}
            <ImagesContent pet={pet} initialImages={initialImages} />

            {/* 기본 정보 */}
            <BreedingInfoContent
              petId={pet.petId}
              ownerId={pet.owner.userId ?? ""}
              initialPet={pet}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* 혈통정보 */}
            <PedigreeInfoContent
              species={pet.species}
              petId={pet.petId}
              userId={pet.owner.userId ?? ""}
              initialParents={initialParents}
            />

            {/* 분양정보 */}
            <AdoptionInfoContent
              petId={pet.petId}
              ownerId={pet.owner.userId ?? ""}
              initialAdoption={initialAdoption}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
