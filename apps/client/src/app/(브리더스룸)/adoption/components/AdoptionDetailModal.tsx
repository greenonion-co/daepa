"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByPetId } from "@repo/api-client";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { cn } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../../components/BadgeList";
import { DateTime } from "luxon";
import Link from "next/link";
import { useIsMobile } from "@/hooks/useMobile";
import AdoptionInfoContent from "../../pet/[petId]/components/AdoptionInfoContent";
import { useUserStore } from "../../store/user";

interface AdoptionDetailModalProps {
  isOpen: boolean;
  petId: string;
  onClose: () => void;
  onUpdate: () => void;
}

interface PetInfoCardProps {
  name?: string;
  species: string;
  sex?: string;
  morphs?: string[];
  traits?: string[];
  hatchingDate?: string;
  isDeleted?: boolean;
  petId: string;
  isMobile?: boolean;
}

const PetInfoCard = ({
  name,
  species,
  sex,
  morphs,
  traits,
  hatchingDate,
  isDeleted,
  petId,
  isMobile,
}: PetInfoCardProps) => {
  const cardContent = (
    <div
      className={cn(
        "mb-4 flex gap-0 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 dark:from-blue-900/30 dark:to-purple-900/30",
        isDeleted ? "cursor-not-allowed" : "hover:shadow-md",
      )}
    >
      <div className={"flex items-center gap-2.5"}>
        <div className={isMobile ? "w-12" : "w-16"}>
          <PetThumbnail petId={petId} maxSize={isMobile ? 50 : 70} />
        </div>
        <div>
          <div
            className={cn(
              "mb-2 flex items-center gap-2 font-semibold dark:text-gray-100",
              isMobile && "text-sm",
            )}
          >
            {isDeleted ? (
              <div>
                <span className="cursor-not-allowed line-through decoration-red-500">{name}</span>
                <span className="text-[12px] font-normal text-red-500">[삭제됨]</span>
              </div>
            ) : (
              name
            )}

            <div className={cn("text-muted-foreground", isMobile ? "text-xs" : "text-sm")}>
              | {(SPECIES_KOREAN_INFO as Record<string, string>)[species] || "미분류"}
            </div>
            {sex && (
              <p className={cn("text-blue-500", isMobile ? "text-xs" : "text-sm")}>
                | {(GENDER_KOREAN_INFO as Record<string, string>)[sex]}
              </p>
            )}
          </div>
          <div
            className={cn(
              "flex flex-col gap-2 text-gray-600 dark:text-gray-300",
              isMobile ? "text-xs" : "text-sm",
            )}
          >
            <BadgeList items={morphs} badgeSize={isMobile ? "sm" : "md"} />
            <BadgeList
              items={traits}
              variant="outline"
              badgeSize={isMobile ? "sm" : "md"}
              badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200"
            />
            {hatchingDate && (
              <p className="font-[600] text-blue-600">
                {DateTime.fromFormat(hatchingDate, "yyyy-MM-dd").toFormat("yy.M.d")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (isDeleted) {
    return cardContent;
  }

  return (
    <Link href={`/pet/${petId}`} className="cursor-pointer">
      {cardContent}
    </Link>
  );
};

const AdoptionDetailModal = ({ isOpen, petId, onClose, onUpdate }: AdoptionDetailModalProps) => {
  const isMobile = useIsMobile();
  const { user } = useUserStore();
  const {
    data: adoptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId, { includeInactive: "true" }),
    enabled: !!petId,
    select: (data) => data.data?.data,
  });

  const petSummary = adoptionData?.pet;
  if (!petSummary) return null;

  const { name, species, hatchingDate, sex, morphs, traits, isDeleted } = petSummary;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] gap-0 overflow-y-auto px-4 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"></DialogTitle>
        </DialogHeader>

        {isLoading && <Loading />}
        {error && <div>Error: {error.message}</div>}

        {/* 펫 정보 */}
        <PetInfoCard
          name={name}
          species={species}
          sex={sex}
          morphs={morphs}
          traits={traits}
          hatchingDate={hatchingDate}
          isDeleted={isDeleted}
          petId={petId}
          isMobile={isMobile}
        />

        <AdoptionInfoContent
          petId={petId}
          ownerId={user?.userId ?? ""}
          initialAdoption={adoptionData as any}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
