import { forwardRef } from "react";
import { PetAdoptionDtoStatus } from "@repo/api-client";
import { cn } from "@/lib/utils";
import { SALE_STATUS_KOREAN_INFO } from "../constants";

const STATUS_STYLE: Record<string, string> = {
  [PetAdoptionDtoStatus.NFS]: "bg-pink-300",
  [PetAdoptionDtoStatus.ON_SALE]: "bg-blue-300",
  [PetAdoptionDtoStatus.ON_RESERVATION]: "bg-yellow-300",
};

const AdoptionStatusBadge = forwardRef<
  HTMLSpanElement,
  { status: PetAdoptionDtoStatus | null | undefined; className?: string }
>(({ status, className, ...props }, ref) => {
  if (!status) return null;

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
