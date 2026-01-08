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
import PedigreeInfo from "../../../pet/[petId]/components/혈통정보";
import AdoptionInfo from "../../../pet/[petId]/components/분양정보";
import BreedingInfo from "../../../pet/[petId]/components/펫정보";
import Images from "../../../pet/[petId]/components/이미지";
import Header from "../../../pet/[petId]/components/Header";

interface PetModalContentProps {
  pet: PetDto;
  initialAdoption: PetAdoptionDto | null;
  initialImages: PetImageItem[];
  initialParents: GetParentsByPetIdResponseDtoData | null;
}

export default function PetModalContent({
  pet,
  initialAdoption,
  initialImages,
  initialParents,
}: PetModalContentProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pb-0 pt-[16px] sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-lg">
        <DialogHeader>
          <DialogTitle className="flex flex-1 flex-col">
            <Header pet={pet} size="small" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
          <div className="space-y-2 sm:flex sm:gap-2 sm:space-y-0">
            {/* 이미지 캐러셀 */}
            <Images pet={pet} initialImages={initialImages} />

            {/* 기본 정보 */}
            <BreedingInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} initialPet={pet} />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {/* 혈통정보 */}
            <PedigreeInfo
              species={pet.species}
              petId={pet.petId}
              userId={pet.owner.userId ?? ""}
              initialParents={initialParents}
            />

            <AdoptionInfo
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
