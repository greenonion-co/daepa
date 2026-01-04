"use client";

import { useRef, useState, useEffect, ReactNode, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import Loading from "@/components/common/Loading";

interface HorizontalScrollSectionProps {
  children: ReactNode;
  className?: string;
  gradientColor?: string;
  hasMore?: boolean;
  isLoading?: boolean;
  onReachEnd?: () => void;
  darkGradientColor?: string;
}

export default function HorizontalScrollSection({
  children,
  className,
  gradientColor = "from-gray-100",
  hasMore = false,
  isLoading = false,
  onReachEnd,
  darkGradientColor = "dark:from-gray-900",
}: HorizontalScrollSectionProps) {
  const isMobile = useIsMobile();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);

    // 오른쪽 끝에 도달했을 때 무한 스크롤 트리거
    const isNearEnd = scrollLeft + clientWidth >= scrollWidth - 100;
    if (isNearEnd && hasMore && !isLoading && onReachEnd) {
      onReachEnd();
    }
  }, [hasMore, isLoading, onReachEnd]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    // ResizeObserver로 컨텐츠 크기 변화 감지
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollAmount = 200;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className={cn("relative", className)}>
      {/* 왼쪽 그라데이션 + 화살표 */}
      {canScrollLeft && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute left-0 top-0 z-[5] h-full w-20 bg-gradient-to-r to-transparent",
              gradientColor,
              darkGradientColor,
            )}
          />
          {!isMobile && (
            <button
              type="button"
              aria-label="왼쪽으로 스크롤"
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </>
      )}

      {/* 스크롤 컨테이너 */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex gap-3 overflow-x-auto pb-3"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div className="flex h-full min-w-[60px] items-center justify-center">
            <Loading />
          </div>
        )}
      </div>

      {/* 오른쪽 그라데이션 + 화살표 */}
      {canScrollRight && (
        <>
          <div
            className={cn(
              "pointer-events-none absolute right-0 top-0 z-[5] h-full w-20 bg-gradient-to-l to-transparent",
              gradientColor,
              darkGradientColor,
            )}
          />
          {!isMobile && (
            <button
              type="button"
              aria-label="오른쪽으로 스크롤"
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-md transition-all hover:bg-gray-50 hover:shadow-lg dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          )}
        </>
      )}
    </div>
  );
}
