import { usePetStore } from "@/app/(브리더스룸)/pet/store/pet";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  petControllerFindPetByPetId,
  petControllerUpdate,
  UpdatePetDto,
  PetDtoType,
  PetDto,
} from "@repo/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { getChangedFields } from "@/lib/utils";
import { toast } from "sonner";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";
import { AxiosError } from "axios";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { useBreedingInfoStore } from "../../store/breedingInfo";

import { PublicToggle } from "./펫정보/PublicToggle";
import { PetBasicInfo } from "./펫정보/PetBasicInfo";
import { PetDetailInfo } from "./펫정보/PetDetailInfo";
import { EggInfo } from "./펫정보/EggInfo";
import EditActionButtons from "./EditActionButtons";

const BreedingInfo = ({ petId, ownerId }: { petId: string; ownerId: string }) => {
  const { formData, errors, setFormData } = usePetStore();
  const { duplicateCheckStatus } = useNameStore();
  const { setBreedingInfo } = useBreedingInfoStore();

  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const isViewingMyPet = useIsMyPet(ownerId);

  // 펫 데이터 조회
  const { data: pet, refetch } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  const isEgg = useMemo(() => pet?.type === PetDtoType.EGG, [pet?.type]);

  // 펫 업데이트 mutation
  const { mutateAsync: mutateUpdatePet } = useMutation({
    mutationFn: (updateData: UpdatePetDto) => petControllerUpdate(pet?.petId ?? "", updateData),
  });

  // 변경된 필드 추출
  const getChangedFieldsForPet = useCallback(
    (original: PetDto, current: typeof formData): UpdatePetDto => {
      return getChangedFields(
        original as unknown as Record<string, unknown>,
        current as unknown as Record<string, unknown>,
        {
          fields: [
            "name",
            "species",
            "growth",
            "sex",
            "desc",
            "hatchingDate",
            "weight",
            "temperature",
            "isPublic",
            "eggStatus",
          ],
          arrayFields: ["morphs", "traits", "foods"],
          convertUndefinedToNull: true,
        },
      );
    },
    [],
  );

  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!pet) return;

    try {
      setIsProcessing(true);

      // 이름 중복 체크
      if (pet.name !== formData.name && duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
        toast.error("이름 중복확인을 완료해주세요.");
        return;
      }

      // 변경된 필드만 추출
      const changedFields = getChangedFieldsForPet(pet, formData);

      // 변경사항이 없으면 종료
      if (Object.keys(changedFields).length === 0) {
        toast.info("변경된 사항이 없습니다.");
        setIsEditMode(false);
        return;
      }

      await mutateUpdatePet(changedFields);
      await refetch();
      toast.success("펫 정보 수정이 완료되었습니다.");
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to update pet:", error);
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "펫 정보 수정에 실패했습니다.");
      } else {
        toast.error("펫 정보 수정에 실패했습니다. " + (error as Error).message);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [formData, mutateUpdatePet, pet, duplicateCheckStatus, refetch, getChangedFieldsForPet]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (pet) {
      setFormData(pet);
    }
    setIsEditMode(false);
  }, [pet, setFormData]);

  // 필드 업데이트 헬퍼
  const updateField = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData],
  );

  // 펫 데이터 및 브리딩 정보 초기화 (통합된 useEffect)
  useEffect(() => {
    if (!pet) return;

    // 폼 데이터 초기화 (편집 모드가 아닐 때만)
    if (!isEditMode) {
      setFormData(pet);
    }

    // 브리딩 정보 업데이트
    setBreedingInfo({
      petId: pet.petId,
      isPublic: pet?.isPublic,
    });
  }, [pet, setFormData, setBreedingInfo, isEditMode]);

  if (!pet || Object.keys(formData).length === 0) return null;

  return (
    <div className="shadow-xs flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">펫정보</div>

      {/* 공개 여부 */}
      <PublicToggle
        isPublic={!!formData.isPublic}
        isEditMode={isEditMode}
        onChange={(isPublic) => updateField("isPublic", isPublic)}
      />

      {/* 기본 정보 */}
      <PetBasicInfo
        formData={formData}
        errors={errors}
        isEditMode={isEditMode}
        isEgg={isEgg}
        onNameChange={(name) => updateField("name", name)}
        onHatchingDateChange={(date) => updateField("hatchingDate", date)}
      />

      {/* 상세 정보 (일반 펫인 경우) */}
      {!isEgg && (
        <PetDetailInfo formData={formData} isEditMode={isEditMode} onFieldChange={updateField} />
      )}

      {/* 알 정보 (알인 경우) */}
      {isEgg && <EggInfo formData={formData} isEditMode={isEditMode} onFieldChange={updateField} />}

      {/* 액션 버튼 */}
      <EditActionButtons
        isVisible={isViewingMyPet}
        isEditMode={isEditMode}
        isProcessing={isProcessing}
        onCancel={handleCancel}
        onSubmit={() => (isEditMode ? handleSave() : setIsEditMode(true))}
      />
    </div>
  );
};

export default BreedingInfo;
