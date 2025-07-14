"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByAdoptionId, PetDtoSpecies } from "@repo/api-client";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { getStatusBadge } from "@/lib/utils";
import Loading from "@/components/common/Loading";

interface AdoptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
}

const AdoptionDetailModal = ({ isOpen, onClose, adoptionId }: AdoptionDetailModalProps) => {
  const {
    data: adoptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByAdoptionId.name, adoptionId],
    queryFn: () => adoptionControllerGetAdoptionByAdoptionId(adoptionId),
    select: (data) => data.data,
  });

  const pet = adoptionData?.pet;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            분양 상세 정보
            {getStatusBadge(pet?.saleStatus)}
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Loading />}
        {error && <div>Error: {error.message}</div>}

        <div className="space-y-4">
          {/* 펫 정보 */}
          <div className="bg-muted rounded-lg p-4">
            <div className="mb-2 flex items-center gap-2 font-semibold">
              {pet?.name}

              {pet?.species && (
                <div className="text-muted-foreground text-sm font-normal">
                  | {SPECIES_KOREAN_INFO[pet.species as PetDtoSpecies]}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2 text-sm text-gray-600">
              {pet?.morphs && pet.morphs.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {pet.morphs.map((morph: string) => `#${morph}`).join(" ")}
                </div>
              )}
              {pet?.birthdate && (
                <p className="text-blue-600">
                  {format(new Date(pet.birthdate), "yyyy. MM. dd", { locale: ko })}
                </p>
              )}
            </div>
          </div>

          {/* 분양 정보 */}
          <div className="space-y-3">
            {adoptionData?.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">분양 가격</span>
                <span className="text-sm">{adoptionData.price.toLocaleString()}원</span>
              </div>
            )}

            {adoptionData?.adoptionDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">분양 날짜</span>
                <span className="text-sm">
                  {format(adoptionData.adoptionDate, "yyyy. MM. dd", { locale: ko })}
                </span>
              </div>
            )}

            {adoptionData?.location && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">거래 장소</span>
                <span className="text-sm">
                  {adoptionData.location === "offline" ? "오프라인" : "온라인"}
                </span>
              </div>
            )}

            {adoptionData?.memo && (
              <div>
                <span className="text-sm font-medium">메모</span>
                <p className="text-muted-foreground mt-1 text-sm">{adoptionData.memo}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
