import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { useState, useEffect, memo, useMemo, useCallback } from "react";
import { petControllerUpdate, UpdatePetDto, PetDto, petControllerFindOne } from "@repo/api-client";
import { toast } from "sonner";

import { format } from "date-fns";
import AdoptionReceipt from "./components/AdoptionReceipt";
import PetVisibilityControl from "./components/PetVisibilityControl";
import AdoptionStatusControl from "./components/AdoptionStatusControl";
import PedigreeSection from "./components/PedigreeSection";
import BreedingInfoSection from "./components/BreedingInfoSection";
import CardBackActions from "./components/CardBackActions";
import { useQueryClient } from "@tanstack/react-query";

interface CardBackProps {
  pet: PetDto;
  from: string | null;
  isWideScreen: boolean;
}

const CardBack = memo(({ pet, from, isWideScreen }: CardBackProps) => {
  const queryClient = useQueryClient();
  const { formData, setFormData, setPage } = usePetStore();

  const [isEditing, setIsEditing] = useState(from === "egg");
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const isNotSold = useMemo(() => pet?.adoption?.status !== "SOLD", [pet?.adoption?.status]);

  useEffect(() => {
    if (from !== "egg") return;

    if (formData.name && formData.morphs && formData.birthdate) {
      setIsTooltipOpen(false);
    } else {
      setIsTooltipOpen(true);
    }
  }, [formData, from]);

  useEffect(() => {
    setFormData(pet);
    setPage("detail");
  }, [pet, setFormData, setPage]);

  const handleSave = useCallback(async () => {
    try {
      const { name, species, morphs, traits, growth, sex, foods, desc, birthdate, weight } =
        formData;

      if (!pet.petId) return;

      const updateData = {
        ...(name && { name }),
        ...(species && { species }),
        ...(morphs && { morphs }),
        ...(traits && { traits }),
        ...(growth && { growth }),
        ...(sex && { sex }),
        ...(foods && { foods }),
        ...(desc && { desc }),
        ...(birthdate && { birthdate: format(birthdate, "yyyyMMdd") }),
        ...(weight && { weight: Number(weight) }),
      };

      await petControllerUpdate(pet.petId, updateData as UpdatePetDto);
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: [petControllerFindOne.name, pet.petId],
      });
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  }, [formData, pet.petId, queryClient]);

  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleCancel = useCallback(() => {
    setIsEditing(false);
  }, []);

  return (
    <div className="relative h-full w-full">
      <div className="h-full">
        <div className="px-6 pb-20">
          <div className="flex items-center justify-between">
            <PetVisibilityControl petId={pet.petId} isPublic={pet.isPublic} />

            {isNotSold && <AdoptionStatusControl pet={pet} />}
          </div>

          {!isWideScreen && pet.adoption && <AdoptionReceipt adoption={pet.adoption} />}

          {/* 혈통 정보 */}
          <PedigreeSection petId={pet.petId} ownerId={pet.owner.userId} />

          {/* 사육 정보 */}
          <BreedingInfoSection isEditing={isEditing} isTooltipOpen={isTooltipOpen} />
        </div>

        {/* 하단 고정 버튼 영역 */}
        <CardBackActions
          petId={pet.petId}
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
});

CardBack.displayName = "CardBack";

export default CardBack;
