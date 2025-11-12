"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByPetId, PetAdoptionDtoStatus } from "@repo/api-client";
import { GENDER_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../constants";
import { getStatusBadge } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import EditAdoptionForm from "./EditAdoptionForm";
import AdoptionReceipt from "../../pet/[petId]/(펫카드)/components/AdoptionReceipt";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface AdoptionDetailModalProps {
  isOpen: boolean;
  petId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const AdoptionDetailModal = ({ isOpen, petId, onClose, onUpdate }: AdoptionDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: adoptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId, { includeInactive: "true" }),
    enabled: !!petId,
    select: (data) => data.data.data,
  });

  const handleCancel = () => {
    setIsEditing(false);
  };

  const petSummary = adoptionData?.pet;
  if (!petSummary) return null;

  const { name, species, hatchingDate, sex, morphs, traits } = petSummary;

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
            <Link href={`/pet/${petId}`} onClick={() => onClose()}>
              <Card className="bg-muted mb-4 flex gap-0 border-2 p-4 hover:shadow-md">
                <div className="mb-2 flex items-center gap-2 font-semibold">
                  {name}

                  <div className="text-muted-foreground text-sm font-normal">
                    / {SPECIES_KOREAN_INFO[species] || "미분류"}
                  </div>
                  {sex && (
                    <p className="text-sm font-normal text-blue-500">/ {GENDER_KOREAN_INFO[sex]}</p>
                  )}
                </div>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  {morphs && morphs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {morphs.map((morph) => (
                        <Badge key={morph}>{morph}</Badge>
                      ))}
                    </div>
                  )}
                  {traits && traits.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {traits.map((trait: string) => `#${trait}`).join(" ")}
                    </div>
                  )}
                  {hatchingDate && <p className="text-blue-600">{hatchingDate}</p>}
                </div>
              </Card>
            </Link>
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
