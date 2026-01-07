"use client";

import { useEffect, useState, useCallback, ReactNode, RefObject, useRef } from "react";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_STORAGE_KEY = "pair-card-tutorial-seen";

// 튜토리얼 스텝 정의
export const PAIR_CARD_TUTORIAL_TARGETS = {
  PARENT_CARDS: "tutorial-parent-cards",
  MINI_CALENDAR: "tutorial-mini-calendar",
  SUMMARY_INFO: "tutorial-summary-info",
  MEMO_AREA: "tutorial-memo-area",
} as const;

// 모의 팝오버 버튼 컴포넌트
function MockPopoverButton({
  label,
  color,
  highlighted,
}: {
  label: string;
  color: "blue" | "amber";
  highlighted?: boolean;
}) {
  const colorClasses = {
    blue: highlighted
      ? "bg-blue-50 text-blue-600 ring-2 ring-blue-400 dark:bg-blue-900/30 dark:text-blue-400"
      : "text-blue-600 dark:text-blue-400",
    amber: highlighted
      ? "bg-amber-50 text-amber-600 ring-2 ring-amber-400 dark:bg-amber-900/30 dark:text-amber-400"
      : "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className={cn("flex items-center gap-1.5 rounded-md px-2 py-1.5", colorClasses[color])}>
      <Plus className="h-3 w-3" />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

// 모의 팝오버 컴포넌트
function MockPopover({
  date,
  highlightMating,
  highlightLaying,
}: {
  date: string;
  highlightMating?: boolean;
  highlightLaying?: boolean;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-gray-50 p-2 shadow-md dark:bg-gray-700">
      <span className="mb-1.5 block text-xs font-semibold text-gray-800 dark:text-gray-200">
        {date}
      </span>
      <div className="flex flex-col gap-1 border-t border-gray-200 pt-1.5 dark:border-gray-600">
        <MockPopoverButton label="메이팅 추가" color="blue" highlighted={highlightMating} />
        <MockPopoverButton label="산란 추가" color="amber" highlighted={highlightLaying} />
      </div>
    </div>
  );
}

interface TutorialStep {
  targetId: string;
  title: string;
  description: ReactNode;
  position: "top" | "bottom" | "left" | "right";
  mockContent?: ReactNode;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.PARENT_CARDS,
    title: "부모 펫 정보",
    description: "부모 이미지를 클릭하면 해당 펫의 상세 페이지로 이동해요",
    position: "bottom",
  },
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.MINI_CALENDAR,
    title: "미니 캘린더",
    description: "색상이 있는 날짜를 클릭하면 상세 정보를 확인할 수 있어요",
    position: "top",
  },
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.MINI_CALENDAR,
    title: "메이팅 추가",
    description: "날짜를 클릭하면 메이팅을 추가할 수 있어요",
    position: "bottom",
    mockContent: <MockPopover date="1월 15일" highlightMating />,
  },
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.MINI_CALENDAR,
    title: "산란 추가",
    description: "같은 방식으로 산란도 기록할 수 있어요",
    position: "bottom",
    mockContent: <MockPopover date="1월 20일" highlightLaying />,
  },
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.SUMMARY_INFO,
    title: "요약 정보",
    description: "유정란 개수와 해칭 현황을 한눈에 확인할 수 있어요",
    position: "top",
  },
  {
    targetId: PAIR_CARD_TUTORIAL_TARGETS.MEMO_AREA,
    title: "메모 영역",
    description: "클릭하면 이 페어에 대한 메모를 작성할 수 있어요",
    position: "top",
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

interface PairCardTutorialOverlayProps {
  onClose: () => void;
  containerRef?: RefObject<HTMLElement | null>;
}

export function PairCardTutorialOverlay({ onClose, containerRef }: PairCardTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const totalSteps = TUTORIAL_STEPS.length;

  // 무한 루프 방지를 위한 방문 스텝 추적
  const visitedStepsRef = useRef<Set<number>>(new Set());

  const currentStepData = TUTORIAL_STEPS[currentStep];

  const updateSpotlight = useCallback(() => {
    if (!containerRef?.current || !currentStepData) return;

    const targetElement = containerRef.current.querySelector(
      `[data-tutorial="${currentStepData.targetId}"]`,
    );

    if (!targetElement) {
      // 현재 스텝을 방문 기록에 추가
      visitedStepsRef.current.add(currentStep);

      // 모든 스텝을 방문했는데도 타겟을 찾지 못하면 튜토리얼 종료
      if (visitedStepsRef.current.size >= totalSteps) {
        onClose();
        return;
      }

      // 타겟을 찾지 못하면 다음 스텝으로
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
      return;
    }

    // 유효한 타겟을 찾으면 방문 기록 초기화
    visitedStepsRef.current.clear();

    const containerRect = containerRef.current.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    const padding = 4;
    const relativeRect: SpotlightRect = {
      top: targetRect.top - containerRect.top - padding,
      left: targetRect.left - containerRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
    };

    setSpotlightRect(relativeRect);

    // 툴팁 위치 계산 (mockContent가 있으면 더 큰 높이 사용)
    const tooltipWidth = 200;
    const tooltipHeight = currentStepData.mockContent ? 160 : 100;
    const gap = 8;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (currentStepData.position) {
      case "top":
        tooltipTop = relativeRect.top - tooltipHeight - gap - 40;
        tooltipLeft = relativeRect.left + relativeRect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        tooltipTop = relativeRect.top + relativeRect.height + gap;
        tooltipLeft = relativeRect.left + relativeRect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        tooltipTop = relativeRect.top + relativeRect.height / 2 - tooltipHeight / 2;
        tooltipLeft = relativeRect.left - tooltipWidth - gap;
        break;
      case "right":
        tooltipTop = relativeRect.top + relativeRect.height / 2 - tooltipHeight / 2;
        tooltipLeft = relativeRect.left + relativeRect.width + gap;
        break;
    }

    // 화면 밖으로 나가지 않도록 조정
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    if (tooltipLeft < 5) tooltipLeft = 5;
    if (tooltipLeft + tooltipWidth > containerWidth - 5) {
      tooltipLeft = containerWidth - tooltipWidth - 5;
    }
    if (tooltipTop < 5) tooltipTop = relativeRect.top + relativeRect.height + gap;
    if (tooltipTop + tooltipHeight > containerHeight - 5) {
      tooltipTop = relativeRect.top - tooltipHeight - gap;
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [containerRef, currentStepData, currentStep, totalSteps, onClose]);

  useEffect(() => {
    updateSpotlight();

    const handleResize = () => updateSpotlight();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, [updateSpotlight]);

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  if (!spotlightRect || !tooltipPosition) return null;

  return (
    <div className="absolute inset-0 z-20 overflow-hidden rounded-2xl">
      {/* 배경 오버레이 (스포트라이트 구멍 제외) */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="pair-card-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.left}
              y={spotlightRect.top}
              width={spotlightRect.width}
              height={spotlightRect.height}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.8)"
          mask="url(#pair-card-spotlight-mask)"
        />
      </svg>

      {/* 스포트라이트 테두리 */}
      <div
        className="pointer-events-none absolute rounded-lg ring-2 ring-blue-400 ring-offset-2 ring-offset-transparent"
        style={{
          top: spotlightRect.top,
          left: spotlightRect.left,
          width: spotlightRect.width,
          height: spotlightRect.height,
        }}
      />

      {/* 닫기 버튼 */}
      <button
        onClick={handleClose}
        className="absolute right-2 top-2 z-10 rounded-full bg-white/70 p-1 text-black/70 backdrop-blur-sm hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 툴팁 */}
      <div
        className="absolute z-10 w-[200px] rounded-xl bg-white p-3 shadow-2xl dark:bg-gray-800"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* 스텝 인디케이터 */}
        <div className="mb-2 flex gap-1">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentStep
                  ? "w-3 bg-blue-500"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500",
              )}
            />
          ))}
        </div>

        <h4 className="mb-1 text-xs font-bold text-gray-900 dark:text-white">
          {currentStepData?.title}
        </h4>

        {/* 모의 콘텐츠 (있는 경우) */}
        {currentStepData?.mockContent && (
          <div className="mb-2 flex justify-center">{currentStepData.mockContent}</div>
        )}

        <p className="mb-2 text-[11px] font-[500] leading-relaxed text-gray-600 dark:text-gray-300">
          {currentStepData?.description}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-blue-500 px-2.5 py-1 text-[10px] font-medium text-white transition-colors hover:bg-blue-600"
          >
            {currentStep < totalSteps - 1 ? "다음" : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Legacy exports for backward compatibility
export function PairCardTutorial({ onClose: _onClose }: { onClose: () => void }) {
  void _onClose;
  return null;
}

export function usePairCardTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const openTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  return { showTutorial, openTutorial, closeTutorial };
}
