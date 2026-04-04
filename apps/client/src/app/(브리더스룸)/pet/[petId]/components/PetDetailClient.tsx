"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { DateTime } from "luxon";
import PetDetailLayout from "./PetDetailLayout";
import BreedingInfoContent from "./BreedingInfoContent";
import ImagesContent from "./ImagesContent";
import PedigreeInfoContent from "./PedigreeInfoContent";
import AdoptionInfoContent from "./AdoptionInfoContent";
import FeedingInfoContent from "./FeedingInfoContent";
import Loading from "@/components/common/Loading";
import { useViewLog } from "@/hooks/useViewLog";

// memo 비교 시 매 렌더마다 새 참조가 생성되지 않도록 상수로 분리
const EMPTY_IMAGES: never[] = [];

interface PetDetailClientProps {
  petId: string;
}

export default function PetDetailClient({ petId }: PetDetailClientProps) {
  useViewLog("pet", petId);

  const {
    data: pet,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  if (isLoading) {
    return (
      <div className="flex h-[calc(100dvh-52px)]">
        <Loading />
      </div>
    );
  }

  if (isError || !pet) {
    return (
      <div className="flex h-[calc(100dvh-52px)] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[15px] font-medium text-gray-500 dark:text-gray-400">
            개체를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">잠시 후 다시 시도해주세요</p>
        </div>
      </div>
    );
  }

  if (pet.isDeleted) {
    return (
      <div className="flex h-[calc(100dvh-52px)] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-[15px] font-medium text-gray-500 dark:text-gray-400">
            삭제된 개체입니다
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            <span className="font-semibold">{pet.name}</span>은(는) 삭제되어 더 이상 조회할 수
            없습니다.
          </p>

          {pet.deletedAt && (
            <div className="text-xs font-[600] text-red-400">
              삭제 일시:{" "}
              {DateTime.fromISO(pet.deletedAt).setLocale("ko").toFormat("yyyy년 M월 d일")}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <PetDetailLayout
      pet={pet}
      breedingSlot={
        <BreedingInfoContent petId={pet.petId} ownerId={pet.owner.userId ?? ""} initialPet={pet} />
      }
      imagesSlot={<ImagesContent pet={pet} initialImages={EMPTY_IMAGES} />}
      pedigreeSlot={
        <PedigreeInfoContent
          species={pet.species}
          petId={pet.petId}
          userId={pet.owner?.userId}
          initialParents={null}
        />
      }
      adoptionSlot={
        <AdoptionInfoContent
          petId={pet.petId}
          ownerId={pet.owner.userId ?? ""}
          initialAdoption={null}
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
  );
}
