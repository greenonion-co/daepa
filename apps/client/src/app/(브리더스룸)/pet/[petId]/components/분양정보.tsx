import {
  adoptionControllerUpdate,
  adoptionControllerCreateAdoption,
  CreateAdoptionDto,
  PetAdoptionDto,
  PetAdoptionDtoLocation,
  PetAdoptionDtoStatus,
  UpdateAdoptionDto,
  adoptionControllerGetAdoption,
} from "@repo/api-client";
import FormItem from "./FormItem";
import SelectFilter from "@/app/(브리더스룸)/components/SelectFilter";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import { isNil, isUndefined, omitBy } from "es-toolkit";
import UserList from "@/app/(브리더스룸)/components/UserList";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";

interface AdoptionInfoProps {
  adoptionId?: string;
  petId: string;
}

const AdoptionInfo = ({ petId, adoptionId }: AdoptionInfoProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const { formData, setFormData } = usePetStore();

  const { data: adoption, refetch } = useQuery({
    queryKey: [adoptionControllerGetAdoption.name, adoptionId],
    queryFn: () => adoptionControllerGetAdoption(adoptionId ?? ""),
    enabled: !!adoptionId,
    select: (response) => response.data.data,
  });

  const adoptionData = useMemo<Partial<PetAdoptionDto>>(
    () => formData?.adoption ?? {},
    [formData?.adoption],
  );

  const { mutateAsync: updateAdoption } = useMutation({
    mutationFn: ({ adoptionId, data }: { adoptionId: string; data: UpdateAdoptionDto }) =>
      adoptionControllerUpdate(adoptionId, data),
  });

  const { mutateAsync: createAdoption } = useMutation({
    mutationFn: (data: CreateAdoptionDto) => adoptionControllerCreateAdoption(data),
  });

  const resetAdoption = useCallback(() => {
    if (isNil(adoption)) {
      setFormData((prev) => ({
        ...prev,
        adoption: {
          status: PetAdoptionDtoStatus.ON_SALE,
          location: PetAdoptionDtoLocation.OFFLINE,
          price: 0,
          adoptionDate: new Date().toISOString(),
          memo: "",
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, adoption }));
    }
  }, [adoption, setFormData]);

  useEffect(() => {
    resetAdoption();
  }, [resetAdoption]);

  const handleSave = useCallback(async () => {
    if (!petId) {
      toast.error("펫 정보를 찾을 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const adoptionId = adoptionData?.adoptionId;

    const newAdoptionDto = omitBy(
      {
        petId,
        price: adoptionData.price ? Number(adoptionData.price) : undefined,
        adoptionDate: adoptionData.adoptionDate,
        memo: adoptionData.memo,
        location: adoptionData.location,
        buyerId: adoptionData.buyer?.userId,
        status: adoptionData.status,
      },
      isUndefined,
    );

    try {
      if (adoptionId) {
        await updateAdoption({ adoptionId, data: newAdoptionDto });
      } else {
        await createAdoption({ ...newAdoptionDto, petId });
      }

      await refetch();
      setIsEditMode(false);
      toast.success("분양 정보가 성공적으로 생성되었습니다.");
    } catch (error) {
      console.error("분양 생성 실패:", error);
      toast.error("분양 생성에 실패했습니다. 다시 시도해주세요.");
    }
  }, [updateAdoption, createAdoption, adoptionData, petId, refetch]);

  const handleSelectBuyer = useCallback(() => {
    if (!isEditMode) return;

    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="rounded-3xl p-4">
          <DialogTitle className="h-4" />
          <UserList
            selectedUserId={adoptionData.buyer?.userId}
            onSelect={(user) => {
              setFormData((prev) => ({
                ...prev,
                adoption: { ...prev.adoption, buyer: user },
              }));
              close();
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [adoptionData.buyer?.userId, setFormData, isEditMode]);

  const showAdoptionInfo = useMemo(() => {
    return !(isNil(adoption) && !isEditMode);
  }, [adoption, isEditMode]);

  return (
    <div className="shadow-xs flex h-full min-w-[300px] flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">분양정보</div>

      {/* 분양 상태, 가격, 날짜, 입양자, 거래 방식, 메모 */}
      <FormItem
        label="분양 상태"
        content={
          <SelectFilter
            disabled={!isEditMode}
            type="adoptionStatus"
            initialItem={!isEditMode && isNil(adoption) ? undefined : adoptionData.status}
            onSelect={(item) => {
              setFormData((prev) => ({ ...prev, adoption: { ...prev.adoption, status: item } }));
            }}
          />
        }
      />

      {!showAdoptionInfo && (
        <div className="flex h-full items-center justify-center text-[14px] text-gray-600">
          분양 정보를 등록해 관리를 시작해보세요!
        </div>
      )}

      {showAdoptionInfo && (
        <>
          <FormItem
            label="가격"
            content={
              <NumberField
                disabled={!isEditMode}
                value={String(adoptionData.price ?? "")}
                setValue={(value) => {
                  setFormData((prev) => ({
                    ...prev,
                    adoption: { ...prev.adoption, price: value.value },
                  }));
                }}
                inputClassName={cn(
                  " h-[32px]  w-full rounded-md border border-gray-200  placeholder:font-[500] pl-2",
                  !isEditMode && "border-none",
                )}
                field={{ name: "adoption.price", unit: "원", type: "number" }}
                stepAmount={10000}
              />
            }
          />

          <FormItem
            label="날짜"
            content={
              <CalendarInput
                placeholder="-"
                editable={isEditMode}
                value={adoptionData.adoptionDate ?? ""}
                onSelect={(date) => {
                  setFormData((prev) => ({
                    ...prev,
                    adoption: { ...prev.adoption, adoptionDate: date?.toISOString() ?? "" },
                  }));
                }}
              />
            }
          />

          <FormItem
            label="입양자"
            content={
              <>
                {!(isNil(adoptionData.buyer?.userId) && isEditMode) && (
                  <div
                    className={cn(
                      "flex h-[32px] w-fit items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
                      adoptionData.buyer?.userId
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-800",
                    )}
                  >
                    {isNil(adoptionData.buyer?.userId) ? (
                      "미정"
                    ) : (
                      <div className="flex items-center gap-1">{adoptionData.buyer?.name}</div>
                    )}
                  </div>
                )}

                {isEditMode && (
                  <Button
                    className="ml-1 h-8 cursor-pointer rounded-lg px-2 text-[12px] text-white"
                    onClick={handleSelectBuyer}
                  >
                    {isNil(adoptionData.buyer?.userId) ? "입양자 선택" : "변경"}
                  </Button>
                )}
              </>
            }
          />

          <FormItem
            label="거래 방식"
            content={
              <div className="flex h-[32px] items-center gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      adoption: { ...prev.adoption, location: PetAdoptionDtoLocation.OFFLINE },
                    }))
                  }
                  className={cn(
                    "h-full cursor-pointer rounded-md px-2 text-sm font-semibold text-gray-800",
                    adoptionData.location === PetAdoptionDtoLocation.OFFLINE
                      ? "bg-white shadow-sm"
                      : "text-gray-600",
                    !isEditMode && "cursor-not-allowed",
                  )}
                  disabled={!isEditMode}
                >
                  오프라인
                </button>
                <button
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      adoption: { ...prev.adoption, location: PetAdoptionDtoLocation.ONLINE },
                    }))
                  }
                  className={cn(
                    "h-full cursor-pointer rounded-md px-2 text-sm font-semibold text-gray-800",
                    adoptionData.location === PetAdoptionDtoLocation.ONLINE
                      ? "bg-white shadow-sm"
                      : "text-gray-600",
                    !isEditMode && "cursor-not-allowed",
                  )}
                  disabled={!isEditMode}
                >
                  온라인
                </button>
              </div>
            }
          />

          <FormItem
            label="메모"
            content={
              <div className="relative pt-2">
                <textarea
                  className={`min-h-[100px] w-full rounded-xl bg-gray-100 p-3 text-left text-[14px] focus:outline-none focus:ring-0 dark:bg-gray-600/50 dark:text-white`}
                  value={String(adoptionData.memo || "")}
                  maxLength={500}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      adoption: { ...prev.adoption, memo: e.target.value },
                    }))
                  }
                  disabled={!isEditMode}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                {isEditMode && (
                  <div className="absolute bottom-4 right-4 text-[12px] text-gray-500">
                    {adoptionData.memo?.length ?? 0}/{500}
                  </div>
                )}
              </div>
            }
          />
        </>
      )}

      <div className="mt-2 flex w-full flex-1 items-end gap-2">
        {isEditMode && (
          <Button
            className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
            onClick={() => {
              resetAdoption();
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
            if (isEditMode) {
              handleSave();
            } else {
              setIsEditMode(true);
            }
          }}
        >
          {!isEditMode
            ? !showAdoptionInfo
              ? "분양 정보 등록"
              : "수정하기"
            : "수정된 사항 저장하기"}
        </Button>
      </div>
    </div>
  );
};

export default AdoptionInfo;
