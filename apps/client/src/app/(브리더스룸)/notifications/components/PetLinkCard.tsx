import { ParentLinkDetailJson } from "@repo/api-client";
import { ArrowRight, Info } from "lucide-react";
import Link from "next/link";
import TooltipText from "../../components/TooltipText";
import PetThumbnail from "@/components/common/PetThumbnail";

interface PetLinkCardProps {
  detailData?: ParentLinkDetailJson | null;
}

const PetLinkCard = ({ detailData }: PetLinkCardProps) => {
  if (!detailData) return null;

  // 새 구조 (primaryPet/secondaryPet) 우선, 구버전 (childPet/parentPet) fallback
  const primary = detailData.primaryPet ?? detailData.childPet;
  const secondary = detailData.secondaryPet ?? detailData.parentPet;

  if (!primary?.id && !secondary?.id) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        {primary?.id && (
          <Link
            href={`/pet/${primary.id}`}
            className="group flex flex-1 cursor-pointer flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            <PetThumbnail
              petId={primary.id}
              alt={primary.name}
              maxSize={128}
              objectFit="cover"
            />
            <TooltipText text={primary.name ?? ""} />
          </Link>
        )}

        {primary?.id && secondary?.id && (
          <ArrowRight className="h-4 w-4" />
        )}

        {secondary?.id && (
          <Link
            href={`/pet/${secondary.id}`}
            className="group flex flex-1 cursor-pointer flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            <PetThumbnail
              petId={secondary.id}
              alt={secondary.name}
              maxSize={128}
              objectFit="cover"
            />
            <TooltipText text={secondary.name ?? ""} />
          </Link>
        )}
      </div>

      {/* 안내 문구 */}
      <div className="flex gap-1 text-blue-700 dark:text-blue-500">
        <Info size={14} />
        <span className="text-xs">개체 사진 및 이름을 클릭하면 미리보기가 열립니다.</span>
      </div>
    </>
  );
};

export default PetLinkCard;
