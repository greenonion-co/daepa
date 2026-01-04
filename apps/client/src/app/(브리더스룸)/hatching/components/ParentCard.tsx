import { useIsMobile } from "@/hooks/useMobile";
import { PetSummaryLayingDto } from "@repo/api-client";
import { Ban } from "lucide-react";
import { cn } from "@/lib/utils";
import PetThumbnail from "@/components/common/PetThumbnail";
import Link from "next/link";

const ParentCard = ({ parent }: { parent?: PetSummaryLayingDto }) => {
  const isMobile = useIsMobile();

  if (!parent) {
    return (
      <div className="flex flex-1 flex-col items-center gap-2">
        <div className="h-20 w-20 rounded-lg bg-gray-200/50" />
        <span className="text-xs text-gray-400">정보없음</span>
      </div>
    );
  }

  return (
    <Link
      href={`/pet/${parent.petId}`}
      className="flex h-full flex-1 flex-col items-center gap-2 rounded-2xl p-[2px] transition-all hover:bg-gradient-to-r hover:from-[#60a5fa] hover:to-[#c084fc]"
    >
      <div className="flex h-full w-full flex-col items-center gap-1 rounded-2xl bg-white dark:bg-neutral-800">
        <div className="relative w-full">
          <PetThumbnail petId={parent.petId} alt={parent.name} maxSize={180} />
          {parent.isDeleted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/30">
              <Ban className="h-5 w-5 text-red-600" />
              <span
                className={cn("mt-2 text-sm font-medium text-red-600", isMobile && "mt-1 text-xs")}
              >
                삭제된 펫입니다.
              </span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-center text-center">
          <span
            className={cn("text-sm font-semibold", parent.isDeleted && "text-red-500 line-through")}
          >
            {parent.name}
          </span>
          {parent.weight && (
            <span className="text-xs font-[600] text-blue-600">
              {Number(parent.weight).toLocaleString()}g
            </span>
          )}
          {parent.morphs && parent.morphs.length > 0 && (
            <span className="text-[11px] text-gray-500">
              {parent.morphs.slice(0, 2).join(" · ")}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ParentCard;
