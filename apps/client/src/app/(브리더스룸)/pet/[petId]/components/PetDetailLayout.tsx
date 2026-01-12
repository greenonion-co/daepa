"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { PetDto } from "@repo/api-client";
import Header from "./Header";

type TabType = "breeding" | "adoption" | "images" | "pedigree";

interface PetDetailLayoutProps {
  pet: PetDto;
  variant?: "page" | "modal";
  breedingSlot: ReactNode;
  imagesSlot: ReactNode;
  pedigreeSlot: ReactNode;
  adoptionSlot: ReactNode;
}

export default function PetDetailLayout({
  pet,
  variant = "page",
  breedingSlot,
  imagesSlot,
  pedigreeSlot,
  adoptionSlot,
}: PetDetailLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabType>("images");
  const isScrollingRef = useRef<boolean>(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const breedingRef = useRef<HTMLDivElement>(null);
  const adoptionRef = useRef<HTMLDivElement>(null);
  const imagesRef = useRef<HTMLDivElement>(null);
  const pedigreeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = variant === "modal" ? scrollContainerRef.current : null;

    const handleScroll = () => {
      // 프로그래밍 방식으로 스크롤 중이면 업데이트하지 않음
      if (isScrollingRef.current) return;

      // 스크롤 위치 계산 (모달 vs 페이지)
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
      const viewportHeight = scrollContainer ? scrollContainer.clientHeight : window.innerHeight;
      const scrollPosition = scrollTop + viewportHeight * 0.3;

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
          // 모달에서는 컨테이너 기준, 페이지에서는 window 기준
          const elementTop = scrollContainer
            ? rect.top - scrollContainer.getBoundingClientRect().top + scrollTop
            : rect.top + window.scrollY;
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
    const target = scrollContainer || window;
    target.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      target.removeEventListener("scroll", handleScroll);

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [variant]);

  const handleTabClick = (tabId: TabType, ref: React.RefObject<HTMLDivElement | null>) => {
    const scrollContainer = variant === "modal" ? scrollContainerRef.current : null;

    // 프로그래밍 방식 스크롤 플래그 설정
    isScrollingRef.current = true;

    // 탭 즉시 변경
    setActiveTab(tabId);

    // 섹션으로 스크롤
    if (ref.current) {
      const headerOffset = variant === "modal" ? 60 : 120;

      if (scrollContainer) {
        // 모달: 컨테이너 내에서 스크롤
        const containerRect = scrollContainer.getBoundingClientRect();
        const elementRect = ref.current.getBoundingClientRect();
        const elementTop = elementRect.top - containerRect.top + scrollContainer.scrollTop;
        const offsetPosition = elementTop - headerOffset;

        scrollContainer.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      } else {
        // 페이지: window 스크롤
        const elementPosition = ref.current.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }

    // 스크롤 이벤트 리스너 추가 (스크롤 완료 감지)
    const target = scrollContainer || window;
    const handleScrollEnd = () => {
      // 기존 타이머가 있으면 클리어
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // 스크롤이 멈춘 후 100ms 대기 후 플래그 해제
      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;
        target.removeEventListener("scroll", handleScrollEnd);
      }, 100);
    };

    target.addEventListener("scroll", handleScrollEnd);
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

  const content = (
    <>
      <Header
        pet={pet}
        tabs={tabs}
        activeTab={activeTab}
        onTabClick={handleTabClick}
        size={variant === "modal" ? "small" : "medium"}
      />

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
    </>
  );

  // 모달일 때는 자체 스크롤 컨테이너 사용
  if (variant === "modal") {
    return (
      <div ref={scrollContainerRef} className="flex flex-1 flex-col gap-3 overflow-y-auto pb-5">
        {content}
      </div>
    );
  }

  // 페이지일 때는 window 스크롤 사용
  return <div className="flex flex-1 flex-col gap-3 pb-5">{content}</div>;
}
