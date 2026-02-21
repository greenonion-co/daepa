"use client";

import { usePetStore } from "@/app/(브리더스룸)/pet/store/pet";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  petControllerFindPetByPetId,
  petControllerUpdate,
  brPetControllerFindAll,
  UpdatePetDto,
  PetDtoType,
  PetDto,
} from "@repo/api-client";
import { InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import { toast } from "@/lib/toast";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";
import { AxiosError } from "axios";
import { useIsMyPet } from "@/hooks/useIsMyPet";

import { PublicToggle } from "./펫정보/PublicToggle";
import { PetBasicInfo } from "./펫정보/PetBasicInfo";
import { PetDetailInfo } from "./펫정보/PetDetailInfo";
import { EggInfo } from "./펫정보/EggInfo";
import { useBreedingInfoStore } from "../../store/breedingInfo";

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

  // 실제 저장 성공한 필드만 추적 (언마운트 시 리스트 캐시 patch용)
  const dirtyFieldsRef = useRef<Set<string>>(new Set());

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
      try {
        await mutateUpdatePet(updateData);
        // 저장 성공 시 로컬 ref 업데이트 (불필요한 재조회 방지)
        if (petRef.current) {
          petRef.current = { ...petRef.current, ...updateData } as PetDto;
        }
        // 변경된 필드 추적
        Object.keys(updateData).forEach((key) => dirtyFieldsRef.current.add(key));
        // 헤더 동기화 (공개여부, 이름)
        if ("isPublic" in updateData || "name" in updateData) {
          const updated = petRef.current;
          setBreedingInfo({
            petId,
            name: updated?.name,
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

  // 상세 페이지를 벗어날 때 변경된 필드만 리스트 캐시에 반영
  useEffect(() => {
    return () => {
      const latest = petRef.current;
      const dirty = dirtyFieldsRef.current;
      if (!latest || dirty.size === 0) return;

      // 실제 변경된 필드만 추출
      const patch: Partial<PetDto> = {};
      dirty.forEach((key) => {
        (patch as any)[key] = (latest as any)[key];
      });

      queryClient.setQueriesData<
        InfiniteData<AxiosResponse<{ data: PetDto[]; meta: unknown }>>
      >({ queryKey: [brPetControllerFindAll.name] }, (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            data: {
              ...page.data,
              data: page.data.data.map((p) =>
                p.petId === latest.petId ? { ...p, ...patch } : p,
              ),
            },
          })),
        };
      });
    };
  }, [queryClient]);

  // 펫 데이터 및 브리딩 정보 초기화
  useEffect(() => {
    if (!pet) return;

    setFormData(pet);

    // 브리딩 정보 업데이트
    setBreedingInfo({
      petId: pet.petId,
      name: pet.name,
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
