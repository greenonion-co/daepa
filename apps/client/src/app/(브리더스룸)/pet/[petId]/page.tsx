"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

import BreedingInfo from "./components/사육정보";
import Header from "./components/Header";
import AdoptionInfo from "./components/분양정보";
import Images from "./components/이미지";
import PedigreeInfo from "./components/혈통정보";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);

  const { data: pet } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  if (!pet) return null;

  return (
    <div className="flex h-full flex-1 flex-col gap-3">
      <Header pet={pet} />

      <div className="flex flex-wrap gap-3 max-[960px]:flex-wrap">
        {/* 사육정보 (개체 이름, 종, 성별, 크기, 모프, 형질, 먹이) */}
        <BreedingInfo petId={petId} />
        {/* 분양 정보 */}
        <AdoptionInfo petId={petId} />

        {/* 사진 */}
        <Images pet={pet} />

        <PedigreeInfo species={pet.species} petId={petId} userId={pet.owner.userId} />
      </div>
    </div>
  );
}

export default PetDetailPage;
