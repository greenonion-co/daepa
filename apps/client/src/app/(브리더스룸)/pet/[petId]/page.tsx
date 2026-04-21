import { Metadata } from "next";
import { cookies } from "next/headers";
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
      title: "조회할 수 없는 개체입니다",
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

  // 비로그인 사용자는 SSR 단계에서 공개 펫 여부로 404 판정 (SEO / 공유링크 soft 404 방지).
  // 로그인 사용자는 소유자 본인의 비공개 펫일 수 있어 Client(React Query + Bearer)에 위임.
  //   - 실제 데이터 로드 / 에러 UI 는 PetDetailClient 가 담당 (isError 분기)
  //   - 로그인 상태에선 매 SSR /auth/token 호출을 피하기 위해 auth-free fetchPet 만 사용
  const cookieStore = await cookies();
  const isLoggedIn = !!cookieStore.get("refreshToken")?.value;
  if (!isLoggedIn) {
    const pet = await fetchPet(petId); // generateMetadata 와 cache() 공유, 중복 요청 없음
    if (!pet) {
      notFound();
    }
  }

  return <PetDetailClient petId={petId} />;
}
