"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByPetId, PetAdoptionDtoStatus } from "@repo/api-client";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { cn, getStatusBadge } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import EditAdoptionForm from "./EditAdoptionForm";
import AdoptionReceipt from "../../pet/[petId]/(펫카드)/components/AdoptionReceipt";
import Link from "next/link";
import PetThumbnail from "@/components/common/PetThumbnail";
import BadgeList from "../../components/BadgeList";
import { DateTime } from "luxon";

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
  onClose: () => void;
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
  onClose,
}: PetInfoCardProps) => {
  const cardContent = (
    <div
      className={cn(
        "mb-4 flex gap-0 rounded-2xl bg-gradient-to-r from-blue-200/25 to-purple-200/25 p-4 dark:from-blue-900/30 dark:to-purple-900/30",
        isDeleted ? "cursor-not-allowed" : "hover:shadow-md",
      )}
    >
      <div className={"flex items-center gap-2.5"}>
        <div className={"w-16"}>
          <PetThumbnail petId={petId} maxSize={70} />
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 font-semibold dark:text-gray-100">
            {isDeleted ? (
              <div>
                <span className="cursor-not-allowed line-through decoration-red-500">{name}</span>
                <span className="text-[12px] font-normal text-red-500">[삭제됨]</span>
              </div>
            ) : (
              name
            )}

            <div className="text-muted-foreground text-sm">
              | {(SPECIES_KOREAN_INFO as Record<string, string>)[species] || "미분류"}
            </div>
            {sex && (
              <p className="text-sm text-blue-500">
                | {(GENDER_KOREAN_INFO as Record<string, string>)[sex]}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-300">
            <BadgeList items={morphs} />
            <BadgeList items={traits} variant="outline" badgeClassName="bg-white text-black dark:bg-gray-700 dark:text-gray-200" />
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
    <Link href={`/pet/${petId}`} onClick={onClose} className="cursor-pointer">
      {cardContent}
    </Link>
  );
};

const AdoptionDetailModal = ({ isOpen, petId, onClose, onUpdate }: AdoptionDetailModalProps) => {
  const {
    data: adoptionData,
    isLoading,
    refetch,
    error,
  } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId, { includeInactive: "true" }),
    enabled: !!petId,
    select: (data) => data.data?.data,
  });

  const petSummary = adoptionData?.pet;
  if (!petSummary) return null;

  const { status } = adoptionData;
  const isSold = status === PetAdoptionDtoStatus.SOLD;
  const { name, species, hatchingDate, sex, morphs, traits, isDeleted } = petSummary;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              분양 상세 정보
              {getStatusBadge(status)}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Loading />}
        {error && <div>Error: {error.message}</div>}

        <div className="space-y-4">
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
            onClose={onClose}
          />

          <div className="space-y-3">
            {isSold ? (
              // 판매완료 영수증
              <AdoptionReceipt adoption={adoptionData} isEditable={false} />
            ) : (
              // 분양 정보 수정폼
              <EditAdoptionForm
                adoptionData={adoptionData}
                onSubmit={(updated: boolean = true) => {
                  if (updated) {
                    onUpdate();
                    refetch();
                  }
                  onClose();
                }}
                onCancel={onClose}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
