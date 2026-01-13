import { Suspense } from "react";
import { PetDto } from "@repo/api-client";
import BreedingInfoContent from "./BreedingInfoContent";
import Images from "./이미지";
import PedigreeInfo from "./혈통정보";
import AdoptionInfo from "./분양정보";
import SectionSkeleton from "./SectionSkeleton";

/**
 * PetDetailLayout에 전달할 슬롯 컴포넌트들을 생성합니다.
 *
 * 이 함수는 page.tsx와 @modal page.tsx에서 동일한 슬롯 구성을 재사용하기 위해 분리되었습니다.
 *
 * @remarks
 * - BreedingInfoContent는 추가 데이터 fetch가 없어 Suspense 없이 직접 렌더링
 * - Images, PedigreeInfo, AdoptionInfo는 각각 별도 API를 호출하므로 Suspense로 감싸서 스트리밍
 */
export function createPetDetailSlots(pet: PetDto) {
  return {
    breedingSlot: (
      <BreedingInfoContent petId={pet.petId} ownerId={pet.owner.userId ?? ""} initialPet={pet} />
    ),
    imagesSlot: (
      <Suspense fallback={<SectionSkeleton />}>
        <Images pet={pet} />
      </Suspense>
    ),
    pedigreeSlot: (
      <Suspense fallback={<SectionSkeleton />}>
        <PedigreeInfo pet={pet} />
      </Suspense>
    ),
    adoptionSlot: (
      <Suspense fallback={<SectionSkeleton />}>
        <AdoptionInfo pet={pet} />
      </Suspense>
    ),
  };
}
