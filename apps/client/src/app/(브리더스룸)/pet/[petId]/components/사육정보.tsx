import NameDuplicateCheckInput from "@/app/(브리더스룸)/components/NameDuplicateCheckInput";
import SelectFilter from "@/app/(브리더스룸)/components/SelectFilter";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { useCallback, useEffect, useState } from "react";
import {
  PetDtoSpecies,
  petControllerFindPetByPetId,
  petControllerUpdate,
  UpdatePetDto,
  PetDtoType,
} from "@repo/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MORPH_LIST_BY_SPECIES } from "@/app/(브리더스룸)/constants";
import { SELECTOR_CONFIGS } from "@/app/(브리더스룸)/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { pick, pickBy } from "es-toolkit";
import { isNil } from "es-toolkit";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/register/types";
import MultiSelect from "@/app/(브리더스룸)/components/MultiSelect";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import { format } from "date-fns";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import FormItem from "./FormItem";

const BreedingInfo = ({ petId }: { petId: string }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const { formData, errors, setFormData } = usePetStore();
  const { duplicateCheckStatus } = useNameStore();

  const { data: pet, refetch } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId),
    select: (response) => response.data.data,
  });

  const isEgg = pet?.type === PetDtoType.EGG;

  const { mutateAsync: mutateUpdatePet } = useMutation({
    mutationFn: (updateData: UpdatePetDto) => petControllerUpdate(pet?.petId ?? "", updateData),
  });

  useEffect(() => {
    if (pet) {
      setFormData(pet);
    }
  }, [pet, setFormData]);

  const handleSave = useCallback(async () => {
    if (!pet) return;

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
        "temperature",
        "eggStatus",
      ]);
      const updateData = pickBy(pickedData, (value) => !isNil(value));
      await mutateUpdatePet(updateData);
      await refetch();
      toast.success("펫 정보 수정이 완료되었습니다.");
      setIsEditMode(false);
    } catch (error) {
      console.error("Failed to update pet:", error);
      toast.error("펫 정보 수정에 실패했습니다.");
    }
  }, [formData, mutateUpdatePet, pet, duplicateCheckStatus, refetch]);

  if (!pet) return null;

  return (
    <div className="shadow-xs flex h-fit w-[300px] flex-1 flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">사육정보</div>

      <FormItem
        label="개체 이름"
        content={
          <NameDuplicateCheckInput
            errorMessage={errors.name || ""}
            disabled={!isEditMode}
            value={String(formData.name || "")}
            placeholder="미정"
            onChange={(e) => {
              setFormData({ ...formData, name: e.target.value });
            }}
          />
        }
      />

      {!isEgg && (
        <FormItem
          label="생년월일"
          content={
            <CalendarInput
              editable={isEditMode}
              placeholder="-"
              value={formData.hatchingDate}
              onSelect={(date) => {
                if (!date) return;
                setFormData({ ...formData, hatchingDate: format(date, "yyyy-MM-dd") });
              }}
            />
          }
        />
      )}
      <FormItem
        label="종"
        content={
          <SelectFilter
            disabled={!isEditMode}
            type="species"
            initialItem={formData.species}
            onSelect={(item) => {
              // 종 수정 시 모프와 형질 초기화
              setFormData({
                ...formData,
                species: item,
                morphs: undefined,
                traits: undefined,
              });
            }}
          />
        }
      />

      {!isEgg && (
        <>
          <FormItem
            label="성별"
            content={
              <SelectFilter
                disabled={!isEditMode}
                type="sex"
                initialItem={formData.sex}
                onSelect={(item) => {
                  setFormData({ ...formData, sex: item });
                }}
              />
            }
          />
          <FormItem
            label="크기"
            content={
              <SelectFilter
                disabled={!isEditMode}
                type="growth"
                initialItem={formData.growth}
                onSelect={(item) => {
                  setFormData({ ...formData, growth: item });
                }}
              />
            }
          />

          <FormItem
            label="몸무게"
            content={
              <NumberField
                disabled={!isEditMode}
                field={{ name: "weight", type: "number", unit: "g" }}
                value={String(formData.weight ?? "")}
                setValue={(value) => {
                  setFormData({ ...formData, weight: value.value });
                }}
                placeholder="몸무게"
                inputClassName={cn(
                  "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
                  !isEditMode && "border-none",
                )}
              />
            }
          />
          <FormItem
            label="모프"
            content={
              <MultiSelect
                disabled={!isEditMode}
                title="모프"
                selectList={MORPH_LIST_BY_SPECIES[formData.species as PetDtoSpecies]}
                initialItems={formData.morphs}
                onSelect={(items) => {
                  setFormData({ ...formData, morphs: items });
                }}
              />
            }
          />

          <FormItem
            label="형질"
            content={
              <MultiSelect
                disabled={!isEditMode}
                title="형질"
                selectList={SELECTOR_CONFIGS.traits.selectList.map((item) => item.value)}
                initialItems={formData.traits}
                onSelect={(items) => {
                  setFormData({ ...formData, traits: items });
                }}
              />
            }
          />

          <FormItem
            label="먹이"
            content={
              <MultiSelect
                disabled={!isEditMode}
                title="먹이"
                selectList={SELECTOR_CONFIGS.foods.selectList.map((item) => item.value)}
                initialItems={formData.foods}
                onSelect={(items) => {
                  setFormData({ ...formData, foods: items });
                }}
              />
            }
          />
        </>
      )}

      {isEgg && (
        <>
          <FormItem
            label="알 상태"
            content={
              <SelectFilter
                disabled={!isEditMode}
                type="eggStatus"
                initialItem={formData.eggStatus}
                onSelect={(item) => {
                  setFormData({ ...formData, eggStatus: item });
                }}
              />
            }
          />

          <FormItem
            label="해칭 온도"
            content={
              <NumberField
                disabled={!isEditMode}
                field={{ name: "temperature", type: "number", unit: "°C" }}
                value={String(formData.temperature ?? "")}
                setValue={(value) => {
                  setFormData({ ...formData, temperature: value.value });
                }}
                inputClassName={cn(
                  "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
                  !isEditMode && "border-none",
                )}
              />
            }
          />
        </>
      )}

      <div className="mt-2 flex w-full flex-1 gap-2">
        {isEditMode && (
          <Button
            className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
            onClick={() => {
              setFormData(pet);
              setIsEditMode(false);
            }}
          >
            취소
          </Button>
        )}
        <Button
          className={cn(
            "flex-2 h-10 cursor-pointer rounded-lg font-bold",
            isEditMode && "bg-red-600 hover:bg-red-600/90",
          )}
          onClick={() => {
            if (!isEditMode) {
              setIsEditMode(true);
            } else {
              handleSave();
            }
          }}
        >
          {!isEditMode ? "수정하기" : "수정된 사항 저장하기"}
        </Button>
      </div>
    </div>
  );
};

export default BreedingInfo;
