import { Metadata } from "next";
import { notFound } from "next/navigation";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { fetchPet } from "./data";
import PetDetailClient from "./components/PetDetailClient";

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

  // generateMetadata와 동일한 cache() 함수 사용 → 추가 요청 없음
  const pet = await fetchPet(petId);
  if (!pet) {
    notFound();
  }

  return <PetDetailClient petId={petId} />;
}
