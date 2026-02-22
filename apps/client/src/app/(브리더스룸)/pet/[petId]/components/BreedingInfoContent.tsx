"use client";

import { usePetStore } from "@/app/(브리더스룸)/pet/store/pet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  petControllerFindPetByPetId,
  petControllerUpdate,
  UpdatePetDto,
  PetDtoType,
  PetDto,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { patchPetListCache } from "../../utils/patchPetListCache";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";
import { AxiosError } from "axios";
import { useIsMyPet } from "@/hooks/useIsMyPet";

import { PublicToggle } from "./펫정보/PublicToggle";
import { PetBasicInfo } from "./펫정보/PetBasicInfo";
import { PetDetailInfo } from "./펫정보/PetDetailInfo";
import { EggInfo } from "./펫정보/EggInfo";
import { useBreedingInfoStore } from "../../store/breedingInfo";
import { useRegisterFlush } from "./FlushContext";

interface BreedingInfoContentProps {
  petId: string;
  ownerId: string;
  initialPet: PetDto | null;
}

const BreedingInfoContent = ({ petId, ownerId, initialPet }: BreedingInfoContentProps) => {
  const queryClient = useQueryClient();
  const { formData, errors, setFormData } = usePetStore();
  const { duplicateCheckStatus } = useNameStore();
  const { setBreedingInfo } = useBreedingInfoStore();

  const isViewingMyPet = useIsMyPet(ownerId);

  // 펫 데이터 조회 (초기 데이터가 있으면 자동 fetch 하지 않음)
  const { data: queryPet } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
    enabled: !initialPet,
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const pet = queryPet ?? initialPet;
  const petRef = useRef(pet);
  useEffect(() => {
    if (pet) petRef.current = pet;
  }, [pet]);

  const isEgg = useMemo(() => pet?.type === PetDtoType.EGG, [pet?.type]);

  // 펫 업데이트 mutation
  const { mutateAsync: mutateUpdatePet } = useMutation({
    mutationFn: (updateData: UpdatePetDto) => {
      if (!petRef.current?.petId) throw new Error("Pet ID is required");
      return petControllerUpdate(petRef.current.petId, updateData);
    },
  });

  // 단일 필드 자동 저장
  const autoSave = useCallback(
    async (updateData: UpdatePetDto) => {
      // 낙관적 업데이트: API 호출 전에 리스트 캐시 즉시 반영
      if (petRef.current) {
        patchPetListCache(queryClient, petRef.current.petId, updateData as Partial<PetDto>);
      }
      try {
        await mutateUpdatePet(updateData);
        // 저장 성공 시 로컬 ref 업데이트 (불필요한 재조회 방지)
        if (petRef.current) {
          petRef.current = { ...petRef.current, ...updateData } as PetDto;
        }
        // 헤더 동기화 (공개여부, 이름, 성별)
        if ("isPublic" in updateData || "name" in updateData || "sex" in updateData) {
          const updated = petRef.current;
          setBreedingInfo({
            petId,
            name: updated?.name,
            sex: updated?.sex,
            isPublic: updated?.isPublic,
          });
        }
      } catch (error) {
        console.error("Failed to update pet:", error);
        if (error instanceof AxiosError) {
          toast.error(error.response?.data?.message ?? "저장에 실패했습니다.");
        } else {
          toast.error("저장에 실패했습니다.");
        }
      }
    },
    [mutateUpdatePet, queryClient, setBreedingInfo, petId],
  );

  // 필드 업데이트 헬퍼 (로컬 상태만)
  const updateField = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [setFormData],
  );

  // 즉시 저장 (select, toggle, multi-select, calendar)
  const updateFieldAndSave = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      autoSave({ [field]: value ?? null });
    },
    [setFormData, autoSave],
  );

  // blur 시 저장 (text, number)
  // 이름은 중복확인 완료 시 useEffect에서 자동 저장
  // 연속 변경(+/- 버튼 연타 등)은 디바운스로 마지막 값만 저장
  const blurTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const handleFieldBlur = useCallback(
    (field: string) => {
      if (field === "name") {
        const currentName = (usePetStore.getState().formData as any).name;
        const originalName = petRef.current?.name;
        if (currentName === originalName) return;
        // 중복확인 버튼 클릭 시 blur가 먼저 발생하므로 지연 후 상태 확인
        setTimeout(() => {
          const status = useNameStore.getState().duplicateCheckStatus;
          if (status !== DUPLICATE_CHECK_STATUS.AVAILABLE && status !== DUPLICATE_CHECK_STATUS.CHECKING) {
            toast.error("이름 중복확인을 완료해주세요.");
          }
        }, 150);
        return;
      }

      clearTimeout(blurTimersRef.current[field]);
      blurTimersRef.current[field] = setTimeout(() => {
        const current = (usePetStore.getState().formData as any)[field] ?? null;
        const original = (petRef.current as any)?.[field] ?? null;
        if (current === original) return;
        autoSave({ [field]: current });
      }, 500);
    },
    [autoSave],
  );

  // 이름 중복확인 완료 시 자동 저장
  const formName = (formData as any).name;
  useEffect(() => {
    if (duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) return;
    const originalName = petRef.current?.name;
    if (formName && formName !== originalName) {
      autoSave({ name: formName });
    }
  }, [duplicateCheckStatus, formName, autoSave]);

  // 미저장 blur 필드를 감지하고 서버에 저장
  const flushUnsavedFields = useCallback(() => {
    const latest = petRef.current;
    if (!latest) return;

    // 디바운스 타이머 정리
    Object.values(blurTimersRef.current).forEach(clearTimeout);

    const BLUR_FIELDS = ["desc", "weight", "temperature"];
    const formData = usePetStore.getState().formData as any;
    const unsaved: Record<string, any> = {};
    for (const field of BLUR_FIELDS) {
      const current = formData[field] ?? null;
      const original = (latest as any)[field] ?? null;
      if (current !== original) {
        unsaved[field] = current;
      }
    }
    if (Object.keys(unsaved).length > 0) {
      // 롤백용 원본 값 저장
      const rollback: Record<string, any> = {};
      for (const field of Object.keys(unsaved)) {
        rollback[field] = (latest as any)[field] ?? null;
      }
      patchPetListCache(queryClient, latest.petId, unsaved);
      return petControllerUpdate(latest.petId, unsaved)
        .then(() => {})
        .catch(() => {
          patchPetListCache(queryClient, latest.petId, rollback);
        });
    }
  }, [queryClient]);

  // 모달 닫힐 때 flush (언마운트 전에 호출됨)
  useRegisterFlush(flushUnsavedFields);

  // 페이지 이동 등 언마운트 시 fallback
  useEffect(() => {
    return () => { flushUnsavedFields(); };
  }, [flushUnsavedFields]);

  // 펫 데이터 및 브리딩 정보 초기화
  useEffect(() => {
    if (!pet) return;

    setFormData(pet);

    // 브리딩 정보 업데이트
    setBreedingInfo({
      petId: pet.petId,
      name: pet.name,
      sex: pet.sex,
      isPublic: pet?.isPublic,
    });
  }, [pet, setFormData, setBreedingInfo]);

  if (!pet || Object.keys(formData).length === 0) return null;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">개체 정보</div>

      {/* 공개 여부 */}
      <PublicToggle
        isPublic={!!formData.isPublic}
        isEditMode={isViewingMyPet}
        onChange={(isPublic) => updateFieldAndSave("isPublic", isPublic)}
      />

      {/* 기본 정보 */}
      <PetBasicInfo
        formData={formData}
        errors={errors}
        isEditMode={isViewingMyPet}
        isEgg={isEgg}
        onNameChange={(name) => updateField("name", name)}
        onHatchingDateChange={(date) => updateFieldAndSave("hatchingDate", date)}
        onFieldBlur={handleFieldBlur}
      />

      {/* 상세 정보 (일반 펫인 경우) */}
      {!isEgg && (
        <PetDetailInfo
          formData={formData}
          isEditMode={isViewingMyPet}
          onFieldChange={updateFieldAndSave}
          onFieldInput={updateField}
          onFieldBlur={handleFieldBlur}
        />
      )}

      {/* 알 정보 (알인 경우) */}
      {isEgg && (
        <EggInfo
          formData={formData}
          isEditMode={isViewingMyPet}
          onFieldChange={updateFieldAndSave}
          onFieldInput={updateField}
          onFieldBlur={handleFieldBlur}
        />
      )}
    </div>
  );
};

export default BreedingInfoContent;
