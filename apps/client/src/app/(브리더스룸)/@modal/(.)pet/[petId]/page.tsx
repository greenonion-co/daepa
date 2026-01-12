import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PetDetailModalBack } from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailModal";
import PetDetailLayout from "@/app/(브리더스룸)/pet/[petId]/components/PetDetailLayout";
import { SectionSkeleton } from "@/app/(브리더스룸)/pet/[petId]/page";
import { fetchPet, preloadPetData } from "@/app/(브리더스룸)/pet/[petId]/data";
import BreedingInfoContent from "@/app/(브리더스룸)/pet/[petId]/components/BreedingInfoContent";
import Images from "@/app/(브리더스룸)/pet/[petId]/components/이미지";
import PedigreeInfo from "@/app/(브리더스룸)/pet/[petId]/components/혈통정보";
import AdoptionInfo from "@/app/(브리더스룸)/pet/[petId]/components/분양정보";

interface PetModalPageProps {
  params: Promise<{
    petId: string;
  }>;
}

export default async function PetModalPage({ params }: PetModalPageProps) {
  const { petId } = await params;

  // 모든 데이터 fetch 병렬 시작
  preloadPetData(petId);

  const pet = await fetchPet(petId);

  if (!pet) {
    notFound();
  }

  /*
   * BreedingInfoContent는 다른 슬롯과 달리 Suspense 없이 직접 사용합니다.
   * 이유: 추가 데이터 fetch가 없고, pet 데이터만 전달하므로 async 작업이 불필요합니다.
   * 다른 슬롯(Images, PedigreeInfo, AdoptionInfo)은 각각 별도 API를 호출하므로 Suspense가 필요합니다.
   */
  return (
    <PetDetailModalBack>
      <PetDetailLayout
        pet={pet}
        variant={"modal"}
        breedingSlot={
          <BreedingInfoContent
            petId={pet.petId}
            ownerId={pet.owner.userId ?? ""}
            initialPet={pet}
          />
        }
        imagesSlot={
          <Suspense fallback={<SectionSkeleton />}>
            <Images pet={pet} />
          </Suspense>
        }
        pedigreeSlot={
          <Suspense fallback={<SectionSkeleton />}>
            <PedigreeInfo pet={pet} />
          </Suspense>
        }
        adoptionSlot={
          <Suspense fallback={<SectionSkeleton />}>
            <AdoptionInfo pet={pet} />
          </Suspense>
        }
      />
    </PetDetailModalBack>
  );
}
