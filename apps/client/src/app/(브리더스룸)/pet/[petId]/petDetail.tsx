"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import CardFront from "./(펫카드)/CardFront";
import CardBack from "./(펫카드)/CardBack";
import { PetDto } from "@repo/api-client";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";
import AdoptionReceipt from "./(펫카드)/components/AdoptionReceipt";
import { useUserStore } from "../../store/user";

interface PetDetailProps {
  pet: PetDto;
  qrCodeDataUrl: string;
}

const PetDetail = ({ pet, qrCodeDataUrl }: PetDetailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");
  const [isWideScreen, setIsWideScreen] = useState(false);

  const { user } = useUserStore();
  const isMyPet = !!user && user.userId === pet.owner.userId;

  // 화면 크기 감지
  useEffect(() => {
    const checkScreenSize = () => {
      setIsWideScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || isWideScreen) return; // 와이드 스크린에서는 스크롤 로직 비활성화

    if (from === "egg") {
      setTimeout(() => {
        container.scrollTo({
          top: 700,
          behavior: "smooth",
        });
      }, 500);
    }

    let lastScrollTop = 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      if (isScrollingRef.current) return;

      const currentTime = Date.now();
      const scrollTop = container.scrollTop;
      const timeDiff = currentTime - lastScrollTime;
      const scrollDiff = scrollTop - lastScrollTop;
      const scrollSpeed = Math.abs(scrollDiff) / timeDiff;
      const cardHeight = 700;

      if (scrollTop > 50 && scrollTop < cardHeight && scrollDiff > 0 && scrollSpeed > 0.3) {
        isScrollingRef.current = true;
        container.scrollTo({
          top: cardHeight,
          behavior: "smooth",
        });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }

      // Back에서 Front로 이동
      if (
        scrollTop > cardHeight &&
        scrollTop < cardHeight + 50 &&
        scrollDiff < 0 &&
        scrollSpeed > 0.3
      ) {
        isScrollingRef.current = true;
        container.scrollTo({
          top: 0,
          behavior: "smooth",
        });
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 500);
      }

      lastScrollTop = scrollTop;
      lastScrollTime = currentTime;
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [from, isWideScreen]);

  if (isWideScreen) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600 dark:bg-blue-900/80 dark:text-blue-200">
            <ChevronDown className="h-4 w-4" />
            카드 정보를 한눈에 확인하세요
          </span>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {/* 왼쪽: CardFront */}
          <div className="h-[700px] w-full bg-white shadow-xl dark:bg-[#18181B]">
            <CardFront pet={pet} qrCodeDataUrl={qrCodeDataUrl} />

            {isMyPet && isWideScreen && pet.adoption && <AdoptionReceipt adoption={pet.adoption} />}
          </div>
          {/* 오른쪽: CardBack */}
          <div className="w-full rounded-xl border-[1.5px] border-gray-300 bg-white shadow-xl dark:bg-[#18181B]">
            <CardBack pet={pet} from={from} isWideScreen={isWideScreen} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[500px] px-4">
      <div className="mb-4 flex justify-center">
        <span className="inline-flex animate-bounce items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm text-blue-600 dark:bg-blue-900/80 dark:text-blue-200">
          <ChevronDown className="h-4 w-4" />
          카드를 스크롤하여 상세 정보 보기
        </span>
      </div>
      <div
        ref={containerRef}
        className="scrollbar-hide relative h-[700px] w-full overflow-y-auto scroll-smooth rounded-lg border-gray-300 bg-white shadow-xl [-ms-overflow-style:'none'] [scrollbar-width:none] dark:bg-[#18181B] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col">
          <div className="h-[700px] shrink-0">
            <CardFront pet={pet} qrCodeDataUrl={qrCodeDataUrl} />
          </div>
          <div className="h-[700px] shrink-0 pt-6">
            <CardBack pet={pet} from={from} isWideScreen={isWideScreen} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
