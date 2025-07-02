"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import CardFront from "./(펫카드)/CardFront";
import CardBack from "./(펫카드)/CardBack";
import { PetDto } from "@repo/api-client";
import { ChevronDown } from "lucide-react";
import { useSearchParams } from "next/navigation";

interface PetDetailProps {
  pet: PetDto;
  qrCodeDataUrl: string;
}

const PetDetail = ({ pet, qrCodeDataUrl }: PetDetailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

      // Front에서 Back으로 이동
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
  }, [from]);

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
            <CardBack pet={pet} from={from} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
