import { Suspense } from "react";

import { Metadata } from "next";
import { DateTime } from "luxon";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { fetchPet, loadPetDetailPageData } from "./data";
import PetDetailLayout from "./components/PetDetailLayout";
import BreedingInfoContent from "./components/BreedingInfoContent";
import Images from "./components/이미지";
import PedigreeInfo from "./components/혈통정보";
import AdoptionInfo from "./components/분양정보";
import SectionSkeleton from "./components/SectionSkeleton";
import FeedingInfo from "./components/피딩정보";

interface PetPageProps {
  params: Promise<{
    petId: string;
  }>;
}

// 동적 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: PetPageProps): Promise<Metadata> {
  const { petId } = await params;
  const pet = await fetchPet(petId);

  if (!pet) {
    return {
      title: "개체를 찾을 수 없습니다",
    };
  }

  // 비공개 펫은 검색엔진 인덱싱 방지
  if (!pet.isPublic) {
    return {
      title: "비공개 개체",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const speciesKorean = SPECIES_KOREAN_INFO[pet.species] || pet.species;
  const morphsText = pet.morphs?.join(", ") || "";
  const description = `${speciesKorean} ${pet.name || ""}${morphsText ? ` - ${morphsText}` : ""}`;

  return {
    title: pet.name ? `${pet.name} | 개체 상세` : `${speciesKorean} | 개체 상세`,
    description,
    openGraph: {
      title: pet.name ? `${pet.name} | 개체 상세` : `${speciesKorean} | 개체 상세`,
      description,
    },
  };
}

export default async function PetPage({ params }: PetPageProps) {
  const { petId } = await params;
  const pet = await loadPetDetailPageData(petId);

  // 삭제된 펫인 경우 처리
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
      feedingSlot={
        <Suspense fallback={<SectionSkeleton />}>
          <FeedingInfo pet={pet} />
        </Suspense>
      }
    />
  );
}
