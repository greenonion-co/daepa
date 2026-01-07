"use client";

import { useEffect, useState, useCallback, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_STORAGE_KEY = "mating-detail-dialog-tutorial-seen";

// 튜토리얼 스텝 정의
export const TUTORIAL_TARGETS = {
  PARENT_LINKS: "tutorial-parent-links",
  SEASON_SELECT: "tutorial-season-select",
  EDIT_DELETE_BUTTONS: "tutorial-edit-delete",
  ADD_MATING_BUTTON: "tutorial-add-mating",
  CLUTCH_TABS: "tutorial-clutch-tabs",
  LAYING_DATE: "tutorial-laying-date",
  EGG_MENU: "tutorial-egg-menu",
} as const;

interface TutorialStep {
  targetId: string;
  title: string;
  description: ReactNode;
  position: "top" | "bottom" | "left" | "right";
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    targetId: TUTORIAL_TARGETS.PARENT_LINKS,
    title: "부모 펫 상세 보기",
    description: "부모 이름을 클릭하면 해당 펫의 상세 페이지로 이동해요",
    position: "bottom",
  },
  {
    targetId: TUTORIAL_TARGETS.SEASON_SELECT,
    title: "시즌 선택",
    description: "드롭다운을 클릭해서 다른 메이팅 시즌을 선택할 수 있어요",
    position: "bottom",
  },
  {
    targetId: TUTORIAL_TARGETS.EDIT_DELETE_BUTTONS,
    title: "메이팅 수정/삭제",
    description: "연필 아이콘으로 메이팅 날짜를 수정하고, 휴지통 아이콘으로 삭제할 수 있어요",
    position: "bottom",
  },
  {
    targetId: TUTORIAL_TARGETS.ADD_MATING_BUTTON,
    title: "메이팅 추가",
    description: "새로운 메이팅을 추가하려면 이 버튼을 클릭하세요",
    position: "left",
  },
  {
    targetId: TUTORIAL_TARGETS.CLUTCH_TABS,
    title: "산란 차수 이동",
    description: "+ 버튼으로 산란을 추가하고, 차수 탭을 클릭해 해당 산란으로 이동해요",
    position: "bottom",
  },
  {
    targetId: TUTORIAL_TARGETS.LAYING_DATE,
    title: "산란 날짜 수정",
    description: "차수 옆 연필 아이콘을 클릭하면 산란 날짜를 수정할 수 있어요",
    position: "right",
  },
  {
    targetId: TUTORIAL_TARGETS.EGG_MENU,
    title: "알 관리 메뉴",
    description: "⋮ 버튼을 클릭하면 해칭 완료, 수정, 삭제 기능을 사용할 수 있어요",
    position: "left",
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

interface MatingDetailDialogTutorialOverlayProps {
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

export function MatingDetailDialogTutorialOverlay({
  onClose,
  containerRef,
}: MatingDetailDialogTutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null);
  const totalSteps = TUTORIAL_STEPS.length;

  const currentStepData = TUTORIAL_STEPS[currentStep];

  const updateSpotlight = useCallback(() => {
    if (!containerRef.current || !currentStepData) return;

    const targetElement = containerRef.current.querySelector(
      `[data-tutorial="${currentStepData.targetId}"]`,
    );

    if (!targetElement) {
      // 타겟을 찾지 못하면 다음 스텝으로
      if (currentStep < totalSteps - 1) {
        setCurrentStep((prev) => prev + 1);
      }
      return;
    }

    const containerRect = containerRef.current.getBoundingClientRect();
    const targetRect = targetElement.getBoundingClientRect();

    // 절대 위치 자식 요소들도 포함하여 전체 영역 계산
    let minTop = targetRect.top;
    let minLeft = targetRect.left;
    let maxRight = targetRect.right;
    let maxBottom = targetRect.bottom;

    // 절대 위치 자식 요소들 찾기
    const absoluteChildren = targetElement.querySelectorAll(".absolute");
    absoluteChildren.forEach((child) => {
      const childRect = child.getBoundingClientRect();
      minTop = Math.min(minTop, childRect.top);
      minLeft = Math.min(minLeft, childRect.left);
      maxRight = Math.max(maxRight, childRect.right);
      maxBottom = Math.max(maxBottom, childRect.bottom);
    });

    const padding = 6;
    const relativeRect: SpotlightRect = {
      top: minTop - containerRect.top - padding,
      left: minLeft - containerRect.left - padding,
      width: maxRight - minLeft + padding * 2,
      height: maxBottom - minTop + padding * 2,
    };

    setSpotlightRect(relativeRect);

    // 툴팁 위치 계산
    const tooltipWidth = 220;
    const tooltipHeight = 80;
    const gap = 12;

    let tooltipTop = 0;
    let tooltipLeft = 0;

    switch (currentStepData.position) {
      case "top":
        tooltipTop = relativeRect.top - tooltipHeight - gap;
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

    if (tooltipLeft < 10) tooltipLeft = 10;
    if (tooltipLeft + tooltipWidth > containerWidth - 10) {
      tooltipLeft = containerWidth - tooltipWidth - 10;
    }
    if (tooltipTop < 10) tooltipTop = relativeRect.top + relativeRect.height + gap;
    if (tooltipTop + tooltipHeight > containerHeight - 10) {
      tooltipTop = relativeRect.top - tooltipHeight - gap;
    }

    setTooltipPosition({ top: tooltipTop, left: tooltipLeft });
  }, [containerRef, currentStepData, currentStep, totalSteps]);

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
    <div className="absolute inset-0 z-50 overflow-hidden rounded-3xl">
      {/* 배경 오버레이 (스포트라이트 구멍 제외) */}
      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <mask id="spotlight-mask">
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
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
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
        className="absolute right-3 top-3 z-10 rounded-full bg-white/10 p-1.5 text-white/70 backdrop-blur-sm hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      {/* 툴팁 */}
      <div
        className="absolute z-10 w-[220px] rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* 스텝 인디케이터 */}
        <div className="mb-2 flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === currentStep
                  ? "w-4 bg-blue-500"
                  : "w-1.5 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500",
              )}
            />
          ))}
        </div>

        <h4 className="mb-1 text-sm font-bold text-gray-900 dark:text-white">
          {currentStepData?.title}
        </h4>
        <p className="mb-3 text-xs font-[500] leading-relaxed text-gray-600 dark:text-gray-300">
          {currentStepData?.description}
        </p>

        <div className="flex items-center justify-between">
          <button
            onClick={handleClose}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            건너뛰기
          </button>
          <button
            onClick={handleNext}
            className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600"
          >
            {currentStep < totalSteps - 1 ? "다음" : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useMatingDetailDialogTutorial(isOpen: boolean) {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const hasSeen = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      if (!hasSeen) {
        const timer = setTimeout(() => {
          setShowTutorial(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    } else {
      // 다이얼로그가 닫힐 때 튜토리얼 상태 리셋
      setShowTutorial(false);
    }
  }, [isOpen]);

  const openTutorial = () => {
    setShowTutorial(true);
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
  };

  return { showTutorial, openTutorial, closeTutorial };
}
