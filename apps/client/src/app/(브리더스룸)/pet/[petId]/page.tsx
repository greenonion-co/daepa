"use client";

import { petControllerFindPetByPetId } from "@repo/api-client";
import { RefObject, use, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import BreedingInfo from "./components/펫정보";
import Header from "./components/Header";
import AdoptionInfo from "./components/분양정보";
import Images from "./components/이미지";
import PedigreeInfo from "./components/혈통정보";
import Loading from "@/components/common/Loading";
import { isAxiosError } from "axios";
import Image from "next/image";

interface PetDetailPageProps {
  params: Promise<{
    petId: string;
  }>;
}

type TabType = "breeding" | "adoption" | "images" | "pedigree";

function PetDetailPage({ params }: PetDetailPageProps) {
  const { petId } = use(params);
  const [activeTab, setActiveTab] = useState<TabType>("images");
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const breedingRef = useRef<HTMLDivElement>(null);
  const adoptionRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const pedigreeRef = useRef<HTMLDivElement>(null);

  const {
    data: pet,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  useEffect(() => {
    const handleScroll = () => {
      // 프로그래밍 방식으로 스크롤 중이면 업데이트하지 않음
      if (isScrollingRef.current) return;

      // 화면 상단에서 30% 위치에서 탭 변경 (더 일찍 변경됨)
      const scrollPosition = window.scrollY + window.innerHeight * 0.3;

      // 각 섹션의 위치 정보 수집
      const sections = [
        { id: "images" as TabType, element: imagesRef.current },
        { id: "breeding" as TabType, element: breedingRef.current },
        { id: "adoption" as TabType, element: adoptionRef.current },
        { id: "pedigree" as TabType, element: pedigreeRef.current },
      ];

      // 현재 스크롤 위치에서 가장 가까운 섹션 찾기
      let currentSection: TabType = "images";
      let minDistance = Infinity;

      sections.forEach((section) => {
        if (section.element) {
          const rect = section.element.getBoundingClientRect();
          const elementTop = rect.top + window.scrollY;
          const distance = Math.abs(elementTop - scrollPosition);

          // 스크롤 위치보다 위에 있고 가장 가까운 섹션
          if (elementTop <= scrollPosition && distance < minDistance) {
            minDistance = distance;
            currentSection = section.id;
          }
        }
      });

      setActiveTab(currentSection);
    };

    // 초기 실행
    handleScroll();

    // 스크롤 이벤트 리스너 등록
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleTabClick = (tabId: TabType, ref: React.RefObject<HTMLDivElement | null>) => {
    // 프로그래밍 방식 스크롤 플래그 설정
    isScrollingRef.current = true;

    // 탭 즉시 변경
    setActiveTab(tabId);

    // 섹션으로 스크롤
    if (ref.current) {
      const headerOffset = 120;
      const elementPosition = ref.current.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }

    // 스크롤 이벤트 리스너 추가 (스크롤 완료 감지)
    const handleScrollEnd = () => {
      // 기존 타이머가 있으면 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 스크롤이 멈춘 후 100ms 대기 후 플래그 해제
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        window.removeEventListener("scroll", handleScrollEnd);
      }, 100);
    };

    window.addEventListener("scroll", handleScrollEnd);
  };

  const tabs: {
    id: TabType;
    label: string;
    ref: RefObject<HTMLDivElement | null>;
  }[] = [
    { id: "images", label: "이미지", ref: imagesRef },
    { id: "breeding", label: "펫정보", ref: breedingRef },
    { id: "adoption", label: "분양정보", ref: adoptionRef },
    { id: "pedigree", label: "혈통정보", ref: pedigreeRef },
  ];

  if (isLoading) return <Loading />;

  if (isError && isAxiosError(error)) {
    const status = error?.response?.status;
    return (
      <div className="flex h-[calc(100vh-52px)] flex-1 flex-col items-center justify-center gap-2">
        <Image src="/assets/lizard.png" alt="Error" width={150} height={150} />
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {status === 404 ? "펫을 찾을 수 없습니다" : "펫 정보를 불러오는 중 오류가 발생했습니다"}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {status === 404 ? "존재하지 않거나 삭제된 펫입니다" : "잠시 후 다시 시도해주세요"}
        </p>
      </div>
    );
  }

  if (!pet) return null;

  // 삭제된 펫인 경우 처리
  if (pet.isDeleted) {
    return (
      <div className="flex h-[calc(100vh-52px)] flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-center">
          <Image src="/assets/lizard.png" alt="Error" width={150} height={150} />

          <div>
            <h1 className="text-[16px] font-[500] text-gray-900 dark:text-gray-100">삭제된 펫입니다</h1>
            <p className="text-[14px] text-gray-500 dark:text-gray-400">
              <span className="font-semibold">{pet.name}</span>은(는) 삭제되어 더 이상 조회할 수
              없습니다.
            </p>
          </div>

          {pet.deletedAt && (
            <div className="text-xs font-[600] text-red-400">
              삭제 일시:{" "}
              {new Date(pet.deletedAt).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 pb-5">
      <Header pet={pet} tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick} />

      <div className="flex flex-wrap gap-3 px-2">
        {/* 펫정보 (개체 이름, 종, 성별, 크기, 모프, 형질, 먹이) */}
        <div
          ref={breedingRef}
          data-section="breeding"
          className="flex min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-2 max-[580px]:max-w-none"
        >
          <BreedingInfo petId={petId} ownerId={pet.owner.userId ?? ""} />
        </div>

        {/* 사진 */}
        <div
          ref={imagesRef}
          data-section="images"
          className="flex min-h-[480px] min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-1 max-[580px]:max-w-none"
        >
          <Images pet={pet} />
        </div>

        {/* 혈통 정보 */}
        <div
          ref={pedigreeRef}
          data-section="pedigree"
          className="flex min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-4 max-[580px]:max-w-none"
        >
          <PedigreeInfo species={pet.species} petId={petId} userId={pet.owner.userId ?? ""} />
        </div>

        {/* 분양 정보 */}
        <div
          ref={adoptionRef}
          data-section="adoption"
          className="flex min-h-[480px] min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-3 max-[580px]:max-w-none"
        >
          <AdoptionInfo petId={petId} ownerId={pet.owner.userId ?? ""} />
        </div>
      </div>
    </div>
  );
}

export default PetDetailPage;
