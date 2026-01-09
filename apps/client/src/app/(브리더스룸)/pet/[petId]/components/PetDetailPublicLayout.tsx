"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { PetDto } from "@repo/api-client";
import Header from "./Header";

type TabType = "breeding" | "adoption" | "images" | "pedigree";

interface PetDetailPublicLayoutProps {
  pet: PetDto;
  breedingSlot: ReactNode;
  imagesSlot: ReactNode;
  pedigreeSlot: ReactNode;
  adoptionSlot: ReactNode;
}

export default function PetDetailPublicLayout({
  pet,
  breedingSlot,
  imagesSlot,
  pedigreeSlot,
  adoptionSlot,
}: PetDetailPublicLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>("images");
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const breedingRef = useRef<HTMLDivElement>(null);
  const adoptionRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const pedigreeRef = useRef<HTMLDivElement>(null);

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

  return (
    <div className="flex flex-1 flex-col gap-3 pb-5">
      <Header pet={pet} tabs={tabs} activeTab={activeTab} onTabClick={handleTabClick} />

      <div className="flex flex-wrap gap-3 px-2">
        {/* 펫정보 */}
        <div
          ref={breedingRef}
          data-section="breeding"
          className="flex min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-2 max-[580px]:max-w-none"
        >
          {breedingSlot}
        </div>

        {/* 사진 */}
        <div
          ref={imagesRef}
          data-section="images"
          className="flex min-h-[480px] min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-1 max-[580px]:max-w-none"
        >
          {imagesSlot}
        </div>

        {/* 혈통 정보 */}
        <div
          ref={pedigreeRef}
          data-section="pedigree"
          className="flex min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-4 max-[580px]:max-w-none"
        >
          {pedigreeSlot}
        </div>

        {/* 분양 정보 */}
        <div
          ref={adoptionRef}
          data-section="adoption"
          className="flex min-h-[480px] min-w-[300px] max-w-[440px] flex-1 max-[580px]:order-3 max-[580px]:max-w-none"
        >
          {adoptionSlot}
        </div>
      </div>
    </div>
  );
}
