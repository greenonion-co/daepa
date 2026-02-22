"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface DeletedPetNameProps {
  name: string | null | undefined;
  className?: string;
  /** 삭제된 펫의 이름 스타일 */
  deletedClassName?: string;
  /** 이름 최대 길이 (초과 시 ... 처리) */
  maxLength?: number;
}

/**
 * 삭제된 펫 이름을 표시하는 공통 컴포넌트
 * - 취소선 + 삭제 아이콘 + 툴팁
 */
const DeletedPetName = ({ name, className, deletedClassName, maxLength }: DeletedPetNameProps) => {
  const displayName = name ?? "-";
  const truncatedName =
    maxLength && displayName.length > maxLength
      ? `${displayName.slice(0, maxLength)}...`
      : displayName;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("flex cursor-help items-center gap-1", className)}>
          <span
            className={cn(
              "text-red-300 italic line-through decoration-red-500 dark:text-red-300",
              deletedClassName,
            )}
          >
            {truncatedName}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent>삭제된 개체입니다</TooltipContent>
    </Tooltip>
  );
};

export default DeletedPetName;
