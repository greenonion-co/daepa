"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import CardFront from "./(펫카드)/CardFront";
import CardBack from "./(펫카드)/CardBack";
import { PetSummaryDto } from "@repo/api-client";

interface PetDetailProps {
  pet: PetSummaryDto;
}

const PetDetail = ({ pet }: PetDetailProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastScrollTop = 0;
    let lastScrollTime = Date.now();

    const handleScroll = () => {
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
  }, []);

  return (
    <div className="mx-auto w-full max-w-[500px] px-4">
      <div
        ref={containerRef}
        className="scrollbar-hide relative h-[600px] w-full overflow-y-auto scroll-smooth rounded-lg border-4 border-gray-300 bg-white shadow-xl [-ms-overflow-style:'none'] [scrollbar-width:none] dark:bg-[#18181B] [&::-webkit-scrollbar]:hidden"
      >
        <div className="flex flex-col">
          <div className="h-[700px] shrink-0">
            <CardFront pet={pet} />
          </div>
          <div className="h-[700px] shrink-0 pt-6">
            <CardBack pet={pet} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PetDetail;
