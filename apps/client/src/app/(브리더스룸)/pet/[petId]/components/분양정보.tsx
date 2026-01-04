import {
  adoptionControllerUpdate,
  PetAdoptionDto,
  PetAdoptionDtoStatus,
  UpdateAdoptionDto,
  adoptionControllerGetAdoptionByPetId,
  PetAdoptionDtoMethod,
  UserProfilePublicDto,
} from "@repo/api-client";
import { AxiosError } from "axios";
import FormItem from "./FormItem";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { cn, getChangedFields } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";
import { isNil, isNotNil, isUndefined, omitBy } from "es-toolkit";
import UserList from "@/app/(브리더스룸)/components/UserList";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import EditActionButtons from "./EditActionButtons";
import { useRouter } from "next/navigation";

interface AdoptionInfoProps {
  petId: string;
  ownerId: string;
}

const AdoptionInfo = ({ petId, ownerId }: AdoptionInfoProps) => {
  const router = useRouter();
  const { setAdoption } = useAdoptionStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adoptionData, setAdoptionData] = useState<Partial<PetAdoptionDto>>({});

  const isViewingMyPet = useIsMyPet(ownerId);

  const { data: adoption, refetch } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId),
    enabled: !!petId,
    select: (response) => response.data.data,
  });

  useEffect(() => {
    if (adoption) {
      setAdoption({
        petId: adoption?.petId,
        price: adoption?.price,
        status: adoption?.status,
      });
    }
  }, [adoption, setAdoption]);

  const { mutateAsync: updateAdoption } = useMutation({
    mutationFn: ({ adoptionId, data }: { adoptionId: string; data: UpdateAdoptionDto }) =>
      adoptionControllerUpdate(adoptionId, data),
  });

  // 변경된 필드 추출을 위한 설정
  const getChangedFieldsForAdoption = useCallback(
    (original: typeof adoption, current: typeof adoptionData): UpdateAdoptionDto => {
      if (!original) {
        // 기존 데이터가 없으면 현재 데이터 전체를 변경된 것으로 간주
        return omitBy(
          {
            price: current.price ? Number(current.price) : undefined,
            adoptionDate: current.adoptionDate,
            memo: current.memo,
            method: current.method,
            buyerId: current.buyer?.userId,
            status: current.status,
          },
          isUndefined,
        );
      }

      const changedFields = getChangedFields(
        original as unknown as Record<string, unknown>,
        current as unknown as Record<string, unknown>,
        {
          fields: ["price", "adoptionDate", "memo", "method", "status", "buyer"],
          convertUndefinedToNull: true, // undefined를 null로 변환하여 서버에서 업데이트되도록 함
        },
      );

      if ("buyer" in changedFields) {
        const buyer = changedFields["buyer"] as UserProfilePublicDto | null;
        changedFields["buyerId"] = buyer?.userId ?? null;
        delete changedFields["buyer"];
      }

      return changedFields;
    },
    [],
  );

  const resetAdoption = useCallback(() => {
    if (isNil(adoption)) {
      setAdoptionData({
        status: PetAdoptionDtoStatus.ON_SALE,
        method: PetAdoptionDtoMethod.PICKUP,
        price: 0,
        adoptionDate: new Date().toISOString(),
        memo: "",
      });
    } else {
      setAdoptionData(adoption);
    }
  }, [adoption]);

  useEffect(() => {
    resetAdoption();
  }, [resetAdoption]);

  const handleSave = useCallback(async () => {
    if (!petId) {
      toast.error("펫 정보를 찾을 수 없습니다. 다시 선택해주세요.");
      return;
    }

    const adoptionId = adoptionData.adoptionId;
    if (!adoptionId) return toast.error("분양할 수 없는 개체입니다. 관리자에게 문의해 주세요.");

    try {
      setIsProcessing(true);

      // 업데이트 경우: 변경된 필드만 추출
      const changedFields = getChangedFieldsForAdoption(adoption, adoptionData);

      // 변경사항이 없으면 API 호출하지 않음
      if (Object.keys(changedFields).length === 0) {
        toast.info("변경된 사항이 없습니다.");
        setIsEditMode(false);
        return;
      }

      if (adoptionData.status === PetAdoptionDtoStatus.SOLD) {
        // 판매완료 확인 모달
        const confirmed = await new Promise<boolean>((resolve) => {
          overlay.open(({ isOpen, close }) => (
            <Dialog
              open={isOpen}
              onOpenChange={() => {
                resolve(false);
                close();
              }}
            >
              <DialogContent className="rounded-3xl p-6 dark:bg-neutral-900">
                <DialogTitle className="text-sm font-semibold text-red-500">주의!</DialogTitle>
                <div className="flex flex-col py-2 text-gray-600 dark:text-gray-400">
                  <span className={"font-semibold"}>정말 분양완료 처리하시겠습니까?</span>
                  <span className={"text-sm"}>
                    - 분양완료 후에는 개체의 소유권이 완전히 이전됩니다.
                  </span>
                  <span className={"text-sm"}>
                    - 더이상 개체 정보를 수정하거나 삭제할 수 없습니다.
                  </span>
                  <span className={"text-sm text-red-500 underline"}>
                    - 이 펫과 관련된 처리되지 않은 부모 요청이 있는 경우, 완료 처리가 불가능합니다.
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      resolve(false);
                      close();
                    }}
                  >
                    취소
                  </Button>
                  <Button
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      resolve(true);
                      close();
                    }}
                  >
                    확인
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ));
        });

        if (!confirmed) {
          setIsProcessing(false);
          return;
        }
      }

      await updateAdoption({ adoptionId, data: changedFields });

      setIsEditMode(false);

      // 판매완료인 경우, 더 이상 본인 펫이 아님
      if (adoptionData.status === PetAdoptionDtoStatus.SOLD) {
        toast.success("분양이 성공적으로 완료되었습니다!");
        router.replace("/pet");
      } else {
        await refetch();
        toast.success("분양 정보가 성공적으로 업데이트되었습니다.");
      }
    } catch (error: unknown) {
      console.error("분양 정보 수정 실패:", error);

      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorMessage = Array.isArray(message) ? message[0] : message;
        toast.error(errorMessage || "분양 정보 수정에 실패했습니다. 다시 시도해주세요.");
      } else {
        toast.error("분양 정보 수정에 실패했습니다. 다시 시도해주세요.");
      }
    } finally {
      setIsProcessing(false);
    }
  }, [updateAdoption, adoptionData, petId, refetch, router, adoption, getChangedFieldsForAdoption]);

  const handleSelectBuyer = useCallback(() => {
    if (!isEditMode) return;

    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="rounded-3xl p-4 dark:bg-neutral-900">
          <DialogTitle className="h-4 text-base font-semibold text-gray-800 dark:text-gray-200">
            입양자를 선택해주세요.
          </DialogTitle>
          <UserList
            selectedUserId={adoptionData.buyer?.userId}
            onSelect={(user) => {
              setAdoptionData((prev) => ({
                ...prev,
                buyer: user,
              }));
              close();
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [adoptionData.buyer?.userId, isEditMode]);

  const showAdoptionInfo = useMemo(() => {
    return !(isNil(adoption) && !isEditMode);
  }, [adoption, isEditMode]);

  const isAdoptionReservedOrSold = useMemo(() => {
    return (
      adoptionData.status === PetAdoptionDtoStatus.ON_RESERVATION ||
      adoptionData.status === PetAdoptionDtoStatus.SOLD
    );
  }, [adoptionData.status]);

  if (!adoption?.adoptionId) return null;

  return (
    <div className="shadow-xs flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">분양정보</div>

      {!showAdoptionInfo && (
        <div className="flex h-full items-center justify-center text-[14px] text-gray-600 dark:text-gray-400">
          분양 정보를 등록해 관리를 시작해보세요!
        </div>
      )}

      {showAdoptionInfo && (
        <>
          {/* 분양 상태, 가격, 날짜, 입양자, 거래 방식, 메모 */}
          <FormItem
            label="분양 상태"
            content={
              <SingleSelect
                saveASAP
                disabled={!isEditMode}
                type="adoptionStatus"
                initialItem={
                  !isEditMode && isNil(adoption) ? undefined : (adoptionData.status ?? "NONE")
                }
                onSelect={(item) => {
                  setAdoptionData((prev) => {
                    const nextStatus = item as PetAdoptionDtoStatus;
                    const isNextStatusReservedOrSold =
                      nextStatus === PetAdoptionDtoStatus.ON_RESERVATION ||
                      nextStatus === PetAdoptionDtoStatus.SOLD;
                    return {
                      ...prev,
                      status: nextStatus,
                      buyer: isNextStatusReservedOrSold ? prev.buyer : undefined,
                      adoptionDate: isNextStatusReservedOrSold ? prev.adoptionDate : undefined,
                    };
                  });
                }}
              />
            }
          />

          <FormItem
            label="가격"
            content={
              <NumberField
                disabled={!isEditMode}
                value={
                  isNotNil(adoptionData.price)
                    ? isEditMode
                      ? String(adoptionData.price)
                      : adoptionData.price.toLocaleString()
                    : isEditMode
                      ? ""
                      : "-"
                }
                setValue={(value) => {
                  setAdoptionData((prev) => ({
                    ...prev,
                    price: value.value === "" ? undefined : Number(value.value),
                  }));
                }}
                inputClassName={cn(
                  " h-[32px] font-[600] w-full rounded-md border border-gray-200 dark:border-gray-700 placeholder:font-[500] pl-2",
                  !isEditMode && "border-none",
                )}
                field={{ name: "adoption.price", unit: "원", type: "number" }}
                stepAmount={10000}
              />
            }
          />

          <FormItem
            label="분양 날짜"
            content={
              !isEditMode || isAdoptionReservedOrSold ? (
                <CalendarInput
                  placeholder="분양 날짜"
                  editable={isEditMode && isAdoptionReservedOrSold}
                  value={adoptionData.adoptionDate}
                  onSelect={(date) => {
                    setAdoptionData((prev) => ({
                      ...prev,
                      adoptionDate: date?.toISOString(),
                    }));
                  }}
                />
              ) : (
                isEditMode && (
                  <div className="flex h-[32px] w-fit items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-[500] text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                    예약중・분양 완료 시 선택 가능
                  </div>
                )
              )
            }
          />

          <FormItem
            label="입양자"
            content={
              <>
                {!(isNil(adoptionData.buyer?.userId) && isEditMode) && (
                  <div
                    className={cn(
                      "mr-1 flex h-[32px] w-fit items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
                      adoptionData.buyer?.userId
                        ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                        : "",
                    )}
                  >
                    {isNil(adoptionData.buyer?.userId) ? (
                      "-"
                    ) : (
                      <div className="flex items-center gap-1">{adoptionData.buyer?.name}</div>
                    )}
                  </div>
                )}

                {isEditMode &&
                  (adoptionData.status === PetAdoptionDtoStatus.ON_RESERVATION ||
                  adoptionData.status === PetAdoptionDtoStatus.SOLD ? (
                    <Button
                      className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600] text-white dark:bg-neutral-800/70"
                      onClick={handleSelectBuyer}
                    >
                      {isNil(adoptionData.buyer?.userId) ? "입양자 선택" : "변경"}
                    </Button>
                  ) : (
                    <div className="flex h-[32px] w-fit items-center gap-1 rounded-lg bg-gray-100 px-2 py-1 text-[12px] font-[500] text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                      예약중・분양 완료 시 선택 가능
                    </div>
                  ))}
              </>
            }
          />

          <FormItem
            label="거래 방식"
            content={
              <SingleSelect
                saveASAP
                disabled={!isEditMode}
                type="adoptionMethod"
                initialItem={
                  !isEditMode && isNil(adoption) ? undefined : (adoptionData.method ?? "NONE")
                }
                onSelect={(item) => {
                  setAdoptionData((prev) => ({
                    ...prev,
                    method: item,
                  }));
                }}
              />
            }
          />

          <FormItem
            label="메모"
            content={
              <div className="relative w-full pt-2">
                <textarea
                  className={cn(
                    `min-h-[100px] w-full rounded-xl bg-gray-100 p-3 text-left text-[14px] focus:outline-none focus:ring-0 dark:bg-neutral-800 dark:text-white`,
                    !isEditMode && "dark:bg-neutral-900",
                  )}
                  value={String(adoptionData.memo || "")}
                  maxLength={500}
                  onChange={(e) =>
                    setAdoptionData((prev) => ({
                      ...prev,
                      memo: e.target.value,
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
                  <div className="absolute bottom-4 right-4 text-[12px] text-gray-500 dark:text-gray-400">
                    {adoptionData.memo?.length ?? 0}/{500}
                  </div>
                )}
              </div>
            }
          />
        </>
      )}

      <EditActionButtons
        isVisible={isViewingMyPet}
        isEditMode={isEditMode}
        isProcessing={isProcessing}
        onCancel={() => {
          resetAdoption();
          setIsEditMode(false);
        }}
        onSubmit={() => (isEditMode ? handleSave() : setIsEditMode(true))}
        defaultLabel={!showAdoptionInfo ? "분양 정보 등록" : "수정하기"}
      />
    </div>
  );
};

export default AdoptionInfo;
