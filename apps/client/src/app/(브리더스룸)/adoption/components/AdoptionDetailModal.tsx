"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByAdoptionId, PetAdoptionDtoStatus } from "@repo/api-client";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { getStatusBadge } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import EditAdoptionForm from "./EditAdoptionForm";
import AdoptionReceipt from "../../pet/[petId]/(펫카드)/components/AdoptionReceipt";

interface AdoptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
  onUpdate: () => void;
}

const AdoptionDetailModal = ({
  isOpen,
  onClose,
  adoptionId,
  onUpdate,
}: AdoptionDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: adoptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByAdoptionId.name, adoptionId],
    queryFn: () => adoptionControllerGetAdoptionByAdoptionId(adoptionId),
    select: (data) => data.data.data,
  });

  const handleCancel = () => {
    setIsEditing(false);
  };

  const pet = adoptionData?.pet;

  if (!pet) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              분양 상세 정보
              {getStatusBadge(adoptionData?.status)}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Loading />}
        {error && <div>Error: {error.message}</div>}

        <div className="space-y-4">
          {/* 펫 정보 */}
          {adoptionData?.status !== PetAdoptionDtoStatus.SOLD && (
            <Card className="bg-muted p-4">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                {pet?.name ?? ""}

                <div className="text-muted-foreground text-sm font-normal">
                  | {SPECIES_KOREAN_INFO[pet.species] || "미분류"}
                </div>
              </div>
              <div className="flex flex-col gap-2 text-sm text-gray-600">
                {pet?.morphs && pet.morphs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {pet.morphs.map((morph: string) => `#${morph}`).join(" ")}
                  </div>
                )}
                {pet?.hatchingDate && <p className="text-blue-600">{pet.hatchingDate}</p>}
              </div>
            </Card>
          )}
          {/* 분양 정보 */}

          <div className="space-y-3">
            {isEditing ? (
              // 수정 폼
              <EditAdoptionForm
                adoptionData={adoptionData}
                handleClose={() => {
                  onUpdate();
                  onClose();
                }}
                handleCancel={handleCancel}
              />
            ) : (
              <AdoptionReceipt adoption={adoptionData} isEditable={false} />
            )}
          </div>
          <div className="flex justify-end">
            {adoptionData?.status !== PetAdoptionDtoStatus.SOLD && !isEditing && (
              <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                수정
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
