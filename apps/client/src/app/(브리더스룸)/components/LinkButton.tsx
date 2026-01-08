"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePetPreviewModal } from "../pet/store/petPreviewModal";

const LinkButton = ({
  href,
  label,
  tooltip,
  className,
  icon,
}: {
  href: string;
  label: string;
  tooltip: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const { openByPetId } = usePetPreviewModal();

  // /pet/{petId} 경로인 경우 모달로 열기
  const isPetLink = href.startsWith("/pet/") && !href.includes("/relation");
  const petId = isPetLink ? href.replace("/pet/", "") : null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPetLink && petId) {
      e.preventDefault();
      openByPetId(petId);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          onClick={handleClick}
          href={href}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-sky-100 py-0.5 pl-2 pr-1 text-sky-600 dark:bg-sky-900 dark:text-sky-400",
            className,
          )}
        >
          {icon}
          {label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default LinkButton;
