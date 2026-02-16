import { forwardRef } from "react";
import { PetAdoptionDtoStatus } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { SALE_STATUS_KOREAN_INFO } from "../constants";

const STATUS_STYLE: Record<string, string> = {
  [PetAdoptionDtoStatus.NFS]: "border border-pink-500 text-pink-500",
  [PetAdoptionDtoStatus.ON_SALE]: "border border-green-500 text-green-500",
  [PetAdoptionDtoStatus.ON_RESERVATION]: "border border-yellow-500 text-yellow-500",
  [PetAdoptionDtoStatus.SOLD]: "border border-blue-500 text-blue-500",
};

const AdoptionStatusBadge = forwardRef<
  HTMLSpanElement,
  { status: PetAdoptionDtoStatus; className?: string }
>(({ status, className, ...props }, ref) => {
  if (!status || status === PetAdoptionDtoStatus.NONE) return null;

  return (
    <span
      ref={ref}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-semibold shadow-sm",
        STATUS_STYLE[status],
        className,
      )}
      {...props}
    >
      {SALE_STATUS_KOREAN_INFO[status]}
    </span>
  );
});

AdoptionStatusBadge.displayName = "AdoptionStatusBadge";

export default AdoptionStatusBadge;