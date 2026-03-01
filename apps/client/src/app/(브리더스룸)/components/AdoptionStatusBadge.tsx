import { forwardRef } from "react";
import { PetAdoptionDtoStatus } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { SALE_STATUS_KOREAN_INFO } from "../constants";

const STATUS_STYLE: Record<string, string> = {
  [PetAdoptionDtoStatus.NFS]: "bg-[#FFE2DD] text-[#93312E] dark:bg-[#5A2523] dark:text-[#FFB4AB]",
  [PetAdoptionDtoStatus.ON_SALE]: "bg-[#D3E5EF] text-[#28638D] dark:bg-[#1E3A5F] dark:text-[#A3C9E8]",
  [PetAdoptionDtoStatus.ON_RESERVATION]: "bg-[#FDECC8] text-[#9F6B15] dark:bg-[#4A3520] dark:text-[#F0C97E]",
};

const AdoptionStatusBadge = forwardRef<
  HTMLSpanElement,
  { status: PetAdoptionDtoStatus | null | undefined; className?: string; children?: React.ReactNode }
>(({ status, className, children, ...props }, ref) => {
  if (!status) return null;

  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
        STATUS_STYLE[status],
        className,
      )}
      {...props}
    >
      {SALE_STATUS_KOREAN_INFO[status]}
      {children}
    </span>
  );
});

AdoptionStatusBadge.displayName = "AdoptionStatusBadge";

export default AdoptionStatusBadge;
