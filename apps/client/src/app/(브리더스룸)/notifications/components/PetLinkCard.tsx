"use client";

import { ParentLinkDetailJson } from "@repo/api-client";
import { ArrowRight, Info } from "lucide-react";
import { usePetPreviewModal } from "../../pet/store/petPreviewModal";
import TooltipText from "../../components/TooltipText";
import PetThumbnail from "@/components/common/PetThumbnail";
import { useIsMobile } from "@/hooks/useMobile";

interface PetLinkCardProps {
  detailData?: ParentLinkDetailJson | null;
}

const PetLinkCard = ({ detailData }: PetLinkCardProps) => {
  const isMobile = useIsMobile();
  const { openByPetId } = usePetPreviewModal();

  if (!detailData) return null;

  if (!detailData.childPet?.id && !detailData.parentPet?.id) return null;

  return (
    <>
      <div className="flex items-center gap-1">
        {detailData.childPet?.id && (
          <div
            onClick={() => openByPetId(detailData.childPet!.id)}
            className="group flex flex-1 cursor-pointer flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            <PetThumbnail
              petId={detailData.childPet.id}
              alt={detailData.childPet.name}
              maxSize={isMobile ? 220 : 128}
            />
            <TooltipText text={detailData.childPet.name ?? ""} />
          </div>
        )}

        {detailData?.childPet?.id && detailData?.parentPet?.id && (
          <ArrowRight className="h-4 w-4" />
        )}

        {detailData.parentPet?.id && (
          <div
            onClick={() => openByPetId(detailData.parentPet!.id)}
            className="group flex flex-1 cursor-pointer flex-col items-center gap-2 transition-all dark:hover:bg-gray-800"
          >
            <PetThumbnail
              petId={detailData?.parentPet?.id}
              alt={detailData.parentPet.name}
              maxSize={28}
            />
            <TooltipText text={detailData.parentPet.name ?? ""} />
          </div>
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
