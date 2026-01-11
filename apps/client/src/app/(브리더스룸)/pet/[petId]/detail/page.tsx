import { Suspense } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { PetDto } from "@repo/api-client";
import { DateTime } from "luxon";
import { getServerRequestHeaders } from "@/lib/server/auth";

import { SPECIES_KOREAN_INFO } from "../../../constants";
import BreedingInfo from "../components/펫정보";
import Images from "../components/이미지";
import PedigreeInfo from "../components/혈통정보";
import AdoptionInfo from "../components/분양정보";
import PetDetailLayout from "../components/PetDetailPublicLayout";

// 섹션 로딩 스켈레톤
function SectionSkeleton() {
  return (
    <div className="flex flex-1 animate-pulse flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="w-15 h-4 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-6 w-40 rounded bg-gray-200 dark:bg-gray-700" />
      <div className="h-[200px] rounded-xl bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

// 펫 데이터 fetch 함수
async function getPet(petId: string): Promise<PetDto | null> {
  const url = `${process.env.NEXT_PUBLIC_SERVER_BASE_URL}/api/v1/pet/${petId}`;
  const headers = await getServerRequestHeaders();

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers,
    });

    if (!res.ok) {
      if (res.status === 404) {
        return null;
      }
      throw new Error("Failed to fetch pet");
    }

    const data = await res.json();
    return data.data;
  } catch {
    return null;
  }
}

// 동적 메타데이터 생성 (SEO)
export async function generateMetadata({ params }: PetDetailPageProps): Promise<Metadata> {
  const { petId } = await params;
  const pet = await getPet(petId);

  if (!pet) {
    return {
      title: "펫을 찾을 수 없습니다",
    };
  }

  // 비공개 펫은 검색엔진 인덱싱 방지
  if (!pet.isPublic) {
    return {
      title: "비공개 펫",
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
    title: pet.name ? `${pet.name} | 펫 상세` : `${speciesKorean} | 펫 상세`,
    description,
    openGraph: {
      title: pet.name ? `${pet.name} | 펫 상세` : `${speciesKorean} | 펫 상세`,
      description,
    },
  };
}

async function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = await params;

  // 데이터 fetch
  const pet = await getPet(petId);

  if (!pet) {
    notFound();
  }

  // 삭제된 펫인 경우 처리
  if (pet.isDeleted) {
    return (
      <div className="flex h-[calc(100vh-52px)] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/assets/lizard.png" alt="Error" width={150} height={150} />

          <div>
            <h1 className="text-[16px] font-[500] text-gray-900 dark:text-gray-100">
              삭제된 펫입니다
            </h1>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{pet.name}</span>은(는) 삭제되어 더 이상 조회할 수
              없습니다.
            </p>
          </div>

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
        <Suspense fallback={<SectionSkeleton />}>
          <BreedingInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
        </Suspense>
      }
      imagesSlot={
        <Suspense fallback={<SectionSkeleton />}>
          <Images pet={pet} />
        </Suspense>
      }
      pedigreeSlot={
        <Suspense fallback={<SectionSkeleton />}>
          <PedigreeInfo species={pet.species} petId={pet.petId} userId={pet.owner.userId ?? ""} />
        </Suspense>
      }
      adoptionSlot={
        <Suspense fallback={<SectionSkeleton />}>
          <AdoptionInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
        </Suspense>
      }
    />
  );
}

export default PetDetailPage;
