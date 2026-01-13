import Image from "next/image";
import { Metadata } from "next";
import { DateTime } from "luxon";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { fetchPet, loadPetDetailPageData } from "./data";
import { createPetDetailSlots } from "./components/createPetDetailSlots";
import PetDetailLayout from "./components/PetDetailLayout";

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

export default async function PetPage({ params }: PetPageProps) {
  const { petId } = await params;
  const pet = await loadPetDetailPageData(petId);

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

  return <PetDetailLayout pet={pet} {...createPetDetailSlots(pet)} />;
}
