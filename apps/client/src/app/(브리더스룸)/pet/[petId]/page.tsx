import { Metadata } from "next";
import { notFound } from "next/navigation";
import { DateTime } from "luxon";
import { SPECIES_KOREAN_INFO, GENDER_KOREAN_INFO, GROWTH_KOREAN_INFO } from "../../constants";
import { fetchPet, fetchPetThumbnail } from "./data";
import { DEFAULT_OG_IMAGE } from "@/lib/metadata";
import PetDetailClient from "./components/PetDetailClient";

interface PetPageProps {
  params: Promise<{
    petId: string;
  }>;
}

// 동적 메타데이터 생성 (SEO + OG)
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
  const ownerName = pet.owner?.name;

  // OG Title: "펫이름 | 소유자명" 또는 "종(한국어) | 개체 상세"
  const title = pet.name
    ? ownerName
      ? `${pet.name} | ${ownerName}`
      : `${pet.name} | 개체 상세`
    : `${speciesKorean} | 개체 상세`;

  // OG Description: 값이 존재하는 항목만 차례대로 표기
  const descParts: string[] = [];
  if (pet.morphs?.length) descParts.push(pet.morphs.join(" · "));
  if (pet.traits?.length) descParts.push(pet.traits.join(" · "));
  if (pet.sex && GENDER_KOREAN_INFO[pet.sex]) descParts.push(GENDER_KOREAN_INFO[pet.sex]);
  if (pet.hatchingDate) {
    descParts.push(DateTime.fromISO(pet.hatchingDate).toFormat("yy.M.d"));
  }
  const growthLabel = pet.growth && GROWTH_KOREAN_INFO[pet.growth];
  if (growthLabel) descParts.push(growthLabel);
  if (pet.desc) descParts.push(pet.desc);
  const description = descParts.join(" · ") || speciesKorean;

  // OG Image: 펫 썸네일이 있으면 사용, 없으면 서비스 로고
  const thumbnailUrl = await fetchPetThumbnail(petId);
  const ogImage = thumbnailUrl || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function PetPage({ params }: PetPageProps) {
  const { petId } = await params;

  // generateMetadata와 동일한 cache() 함수 사용 → 추가 요청 없음
  const pet = await fetchPet(petId);
  if (!pet) {
    notFound();
  }

  return <PetDetailClient petId={petId} />;
}
