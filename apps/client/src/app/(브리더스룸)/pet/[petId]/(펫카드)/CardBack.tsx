"use client";

import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { useState, useEffect, memo, useMemo, useCallback } from "react";
import {
  UpdatePetDto,
  PetDto,
  petControllerUpdate,
  petControllerFindPetByPetId,
  PetDtoType,
} from "@repo/api-client";
import { toast } from "sonner";

import AdoptionReceipt from "./components/AdoptionReceipt";
import PetVisibilityControl from "./components/PetVisibilityControl";
import AdoptionStatusControl from "./components/AdoptionStatusControl";
import PedigreeSection from "./components/PedigreeSection";
import BreedingInfoSection from "./components/BreedingInfoSection";
import CardBackActions from "./components/CardBackActions";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { isNil, orderBy, pick, pickBy } from "es-toolkit";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/register/types";

interface CardBackProps {
  pet: PetDto;
  from: string | null;
  isWideScreen: boolean;
}

const CardBack = memo(({ pet, from, isWideScreen }: CardBackProps) => {
  const queryClient = useQueryClient();
  const { formData, setFormData, setPage } = usePetStore();
  const { duplicateCheckStatus } = useNameStore();
  const { user } = useUserStore();
  const isMyPet = !!user && user.userId === pet.owner.userId;
  const [isEditing, setIsEditing] = useState(from === "egg");
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  const initialPetData = useMemo(
    () => ({
      ...pet,
      photos: orderBy(
        pet.photos ?? [],
        [
          (photo) => {
            const fileKey = photo.fileName;
            const index = pet.photoOrder?.indexOf(fileKey);
            return index === -1 ? Infinity : index;
          },
        ],
        ["asc"],
      ),
    }),
    [pet],
  );

  const { mutateAsync: mutateUpdatePet } = useMutation({
    mutationFn: (updateData: UpdatePetDto) => petControllerUpdate(pet.petId, updateData),
  });

  const isNotSold = useMemo(() => pet?.adoption?.status !== "SOLD", [pet?.adoption?.status]);

  useEffect(() => {
    if (from !== "egg") return;

    if (formData.name && formData.morphs && formData.hatchingDate) {
      setIsTooltipOpen(false);
    } else {
      setIsTooltipOpen(true);
    }
  }, [formData, from]);

  useEffect(() => {
    setFormData(initialPetData);
    setPage("detail");
  }, [initialPetData, setFormData, setPage]);

  const handleSave = useCallback(async () => {
    try {
      if (!pet.petId) return;

      if (pet.name !== formData.name && duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
        toast.error("이름 중복확인을 완료해주세요.");
        return;
      }

      const pickedData = pick(formData, [
        "name",
        "species",
        "morphs",
        "traits",
        "growth",
        "sex",
        "foods",
        "desc",
        "hatchingDate",
        "weight",
        "photos",
        "temperature",
        "eggStatus",
      ]);
      const updateData = pickBy(pickedData, (value) => !isNil(value));
      await mutateUpdatePet(updateData);
      setIsEditing(false);
      queryClient.invalidateQueries({
        queryKey: [petControllerFindPetByPetId.name, pet.petId],
      });
      toast.success("펫 정보 수정이 완료되었습니다.");
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  }, [formData, queryClient, mutateUpdatePet, pet.petId, duplicateCheckStatus, pet.name]);

  const handleEditToggle = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const handleCancel = useCallback(() => {
    setFormData(initialPetData);
    setIsEditing(false);
  }, [initialPetData, setFormData]);

  return (
    <div className="relative h-full w-full pt-2">
      <div className="px-6 pb-20">
        {isMyPet && (
          <div className="flex items-center justify-between">
            <PetVisibilityControl petId={pet.petId} isPublic={pet.isPublic} />

            {isNotSold && <AdoptionStatusControl pet={pet} />}
          </div>
        )}

        {!isWideScreen && pet.adoption && isMyPet && <AdoptionReceipt adoption={pet.adoption} />}

        {/* 혈통 정보 */}
        <PedigreeSection petId={pet.petId} isMyPet={isMyPet} />

        {/* 사육 정보 */}
        <BreedingInfoSection
          isEgg={pet.type === PetDtoType.EGG}
          isEditing={isEditing}
          isTooltipOpen={isTooltipOpen}
        />
      </div>

      {/* 하단 고정 버튼 영역 */}
      {isMyPet && (
        <CardBackActions
          petId={pet.petId}
          isEditing={isEditing}
          onEditToggle={handleEditToggle}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
});

CardBack.displayName = "CardBack";

export default CardBack;
