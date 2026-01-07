import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

import { useMemo, useState } from "react";
import {
  pairControllerGetPairList,
  LayingByDateDto,
  layingControllerCreate,
  MatingByDateDto,
  PetDtoSpecies,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Info } from "lucide-react";
import { DateTime } from "luxon";
import { toast } from "sonner";
import { AxiosError } from "axios";
import CalendarSelect from "./CalendarSelect";
import CustomSelect from "./Charts/CustomSelect";
import { SPECIES_KOREAN_INFO } from "../../constants";
import NumberField from "../../components/Form/NumberField";
import FormItem from "../../pet/[petId]/components/FormItem";

interface CreateLayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  matingId?: number;
  matingDate?: string;
  fatherId?: string;
  motherId?: string;
  layingData?: LayingByDateDto[];
  initialLayingDate?: string;
  isLayingDateEditable?: boolean;
  matingsByDate?: MatingByDateDto[];
}

const CreateLayingModal = ({
  isOpen,
  onClose,
  matingId,
  matingDate,
  layingData,
  fatherId,
  motherId,
  initialLayingDate,
  isLayingDateEditable = true,
  matingsByDate,
}: CreateLayingModalProps) => {
  const queryClient = useQueryClient();

  // 선택 모드에서만 사용하는 로컬 state
  const [localSelectedMatingId, setLocalSelectedMatingId] = useState<number | undefined>(undefined);

  // matingId prop이 있으면 그것을 사용, 없으면 로컬 state 사용
  const selectedMatingId = matingId ?? localSelectedMatingId;

  // 선택된 메이팅의 데이터
  const selectedMating = useMemo(() => {
    if (matingsByDate && matingsByDate.length > 0) {
      return matingsByDate.find((m) => m.id === selectedMatingId);
    }
    return undefined;
  }, [matingsByDate, selectedMatingId]);

  // 선택된 메이팅의 layingData
  const currentLayingData = selectedMating?.layingsByDate ?? layingData;
  // 선택된 메이팅의 matingDate
  const currentMatingDate = selectedMating?.matingDate ?? matingDate;

  const lastLayingDate = useMemo(
    () => currentLayingData?.[currentLayingData.length - 1]?.layingDate,
    [currentLayingData],
  );

  const { mutateAsync: createLaying } = useMutation({
    mutationFn: layingControllerCreate,
  });

  const defaultLayingDate = useMemo(() => {
    // initialLayingDate가 있으면 우선 사용
    if (initialLayingDate) {
      return DateTime.fromFormat(initialLayingDate, "yyyy-MM-dd").toISO() ?? initialLayingDate;
    }
    return lastLayingDate
      ? new Date(
          new Date(
            lastLayingDate.toString().replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
          ).getTime() +
            24 * 60 * 60 * 1000,
        ).toISOString()
      : new Date().toISOString();
  }, [lastLayingDate, initialLayingDate]);

  const maxClutch = useMemo(() => {
    if (!currentLayingData || currentLayingData.length === 0) return 0;

    // layingData의 각 항목에서 clutch 값을 추출하여 최대값 찾기
    const clutches = currentLayingData
      .map((laying) => {
        // LayingByDateDto 내의 layings 배열에서 첫 번째 항목의 clutch를 가져옴
        return laying.layings?.[0]?.clutch as number | undefined;
      })
      .filter((clutch): clutch is number => clutch !== undefined && clutch !== null);

    return clutches.length > 0 ? Math.max(...clutches) : 0;
  }, [currentLayingData]);

  const [formData, setFormData] = useState<{
    species: PetDtoSpecies;
    layingDate: string;
    clutchCount: string;
    temperature: string;
    clutch: string;
  }>({
    species: PetDtoSpecies.CRESTED,
    layingDate: defaultLayingDate,
    clutchCount: "2",
    temperature: "25",
    clutch: String(maxClutch + 1),
  });

  const handleSubmit = async () => {
    // 선택 모드에서 메이팅이 선택되지 않은 경우
    if (!matingDate && matingsByDate && !selectedMatingId) {
      toast.error("메이팅을 선택해주세요.");
      return;
    }

    if (!formData.species) {
      toast.error("종은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.layingDate) {
      toast.error("산란일은 필수 입력 항목입니다.");
      return;
    }

    if (!formData.clutchCount) {
      toast.error("산란 수는 필수 입력 항목입니다.");
      return;
    }

    try {
      await createLaying({
        matingId: selectedMatingId,
        layingDate: DateTime.fromJSDate(new Date(formData.layingDate)).toFormat("yyyy-MM-dd"),
        temperature: formData.temperature ? parseFloat(formData.temperature) : undefined,
        species: formData.species,
        clutchCount: parseInt(formData.clutchCount, 10),
        clutch: formData.clutch ? parseInt(formData.clutch, 10) : undefined,
        motherId,
        fatherId,
      });
      toast.success("산란이 추가되었습니다.");
      await queryClient.invalidateQueries({ queryKey: [pairControllerGetPairList.name] });
      onClose();
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "산란 추가에 실패했습니다.");
      } else {
        toast.error("산란 추가에 실패했습니다.");
      }
    }
  };

  // 날짜 제한 함수
  const isDateDisabled = (date: Date) => {
    const selectedDate = DateTime.fromJSDate(date).startOf("day");

    // currentMatingDate 이후 조건
    if (currentMatingDate) {
      const matingDateTime = DateTime.fromFormat(currentMatingDate, "yyyy-MM-dd").startOf("day");
      if (selectedDate <= matingDateTime) {
        return true;
      }
    }

    // lastLayingDate 이후 조건
    if (lastLayingDate) {
      const lastLayingDateTime = DateTime.fromFormat(lastLayingDate, "yyyy-MM-dd").startOf("day");

      if (selectedDate <= lastLayingDateTime) {
        return true;
      }
    }

    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {!isLayingDateEditable && (
              <div>{DateTime.fromISO(formData.layingDate).toFormat("yy년 M월 dd일")}</div>
            )}
            <span className="text-[16px] font-[500] text-gray-600"> 산란 정보 추가</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <FormItem
            label="종"
            content={
              <CustomSelect
                title="종"
                disabled
                options={Object.values(PetDtoSpecies).map((species) => ({
                  key: species,
                  value: SPECIES_KOREAN_INFO[species],
                }))}
                selectedKey={formData.species}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, species: value as PetDtoSpecies }))
                }
              />
            }
          />

          {/* 메이팅 선택 (matingDate가 없고 matingsByDate가 있는 경우) */}
          {!matingDate && matingsByDate && matingsByDate.length > 0 && (
            <FormItem
              label="메이팅"
              content={
                <div className="col-span-3 flex flex-col gap-1">
                  <CustomSelect
                    title="메이팅 선택"
                    options={matingsByDate
                      .filter((mating) => {
                        // matingDate가 없거나 formData.layingDate보다 이전인 메이팅만 표시
                        if (!mating.matingDate) return true;
                        if (!formData.layingDate) return true;
                        const matingDateTime = DateTime.fromFormat(
                          mating.matingDate,
                          "yyyy-MM-dd",
                        ).startOf("day");
                        const layingDateTime = DateTime.fromISO(formData.layingDate).startOf("day");
                        return matingDateTime < layingDateTime;
                      })
                      .map((mating, index, filteredArray) => {
                        const season = filteredArray.length - index;

                        return {
                          key: String(mating.id),
                          value: mating.matingDate
                            ? DateTime.fromFormat(mating.matingDate, "yyyy-MM-dd").toFormat(
                                `[시즌${season}] M월 d일`,
                              )
                            : `시즌 ${season}`,
                        };
                      })}
                    selectedKey={String(selectedMatingId)}
                    onChange={(value) => setLocalSelectedMatingId(Number(value))}
                  />
                  {!isLayingDateEditable && (
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Info className="h-4 w-4" /> 산란일 이전의 메이팅만 선택 가능합니다.
                    </div>
                  )}
                  {!selectedMatingId && (
                    <div className="flex items-center gap-1 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" /> 산란을 기록할 메이팅 시즌을 선택해주세요.
                    </div>
                  )}
                </div>
              }
            />
          )}
          {selectedMatingId && (
            <>
              {isLayingDateEditable && (
                <FormItem
                  label="산란일"
                  content={
                    <div className="col-span-3">
                      <CalendarSelect
                        type="edit"
                        triggerText={
                          formData.layingDate
                            ? DateTime.fromJSDate(new Date(formData.layingDate)).toFormat(
                                "yyyy년 MM월 dd일",
                              )
                            : "산란일"
                        }
                        confirmButtonText="선택 완료"
                        disabledDates={currentLayingData?.map((laying) => laying.layingDate) ?? []}
                        onConfirm={(date) => {
                          if (!date) return;
                          setFormData((prev) => ({
                            ...prev,
                            layingDate: date,
                          }));
                        }}
                        disabled={isDateDisabled}
                        initialDate={formData.layingDate}
                      />

                      {lastLayingDate && (
                        <div className="mt-1 text-sm">
                          <div className="flex items-center gap-1 text-gray-500">
                            <Info className="h-4 w-4" /> 이전 산란일 이후 날짜만 선택 가능합니다.
                          </div>
                          <div className="font-semibold text-blue-500">
                            마지막 산란일:{" "}
                            {DateTime.fromJSDate(
                              new Date(
                                lastLayingDate
                                  .toString()
                                  .replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3"),
                              ),
                            ).toFormat("yyyy년 MM월 dd일")}
                          </div>
                        </div>
                      )}
                    </div>
                  }
                />
              )}

              <FormItem
                label="차수"
                content={
                  <div className="col-span-3 flex flex-col gap-1">
                    <NumberField
                      field={{
                        name: "clutch",
                        type: "number",
                      }}
                      value={formData.clutch}
                      setValue={(value) =>
                        setFormData((prev) => ({ ...prev, clutch: value.value }))
                      }
                      inputClassName="h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]"
                      readOnly
                      min={maxClutch + 1}
                    />

                    {maxClutch > 0 && (
                      <div className="col-span-3">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Info className="h-4 w-4" /> 가장 마지막 차수는 {maxClutch}차 입니다.
                        </div>
                      </div>
                    )}
                  </div>
                }
              />

              <FormItem
                label="알 개수"
                content={
                  <NumberField
                    field={{
                      name: "clutchCount",
                      type: "number",
                    }}
                    value={formData.clutchCount}
                    setValue={(value) =>
                      setFormData((prev) => ({ ...prev, clutchCount: value.value }))
                    }
                    readOnly
                    min={1}
                    max={4}
                    inputClassName="h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]"
                  />
                }
              />

              <FormItem
                label="해칭 온도"
                content={
                  <NumberField
                    readOnly
                    field={{ name: "temperature", type: "number", unit: "°C" }}
                    value={String(formData.temperature ?? "")}
                    setValue={(value) =>
                      setFormData((prev) => ({ ...prev, temperature: value.value }))
                    }
                    inputClassName="h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]"
                    min={22}
                    max={28}
                  />
                }
              />
            </>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="h-[32px] cursor-pointer rounded-lg bg-gray-100 px-3 text-sm font-semibold text-gray-600 hover:bg-gray-200"
            onClick={onClose}
          >
            취소
          </button>
          <button
            className="h-[32px] cursor-pointer rounded-lg bg-blue-500 px-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300 disabled:text-gray-500"
            onClick={handleSubmit}
            disabled={!matingDate && matingsByDate && !selectedMatingId}
          >
            추가
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateLayingModal;
