"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import { use } from "react";
import { useQuery } from "@tanstack/react-query";

import BreedingInfo from "./components/사육정보";
import Header from "./components/Header";

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
    <div className="flex h-full flex-1 flex-col">
      <Header pet={pet} />

      <div className="flex">
        {/* 사육정보 (개체 이름, 종, 성별, 크기, 모프, 형질, 먹이) */}
        <BreedingInfo petId={petId} />

        {/* 사진 */}

        {/* 혈통 정보 */}

        {/* 분양 정보 */}
      </div>
    </div>
  );
}

export default PetDetailPage;
