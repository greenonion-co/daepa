"use client";

import {
  petAdoptionControllerUpdatePetAdoption,
  adoptionHistoryControllerCompleteAdoption,
  PetAdoptionDto,
  PetAdoptionDtoStatus,
  UpdateAdoptionDtoStatus,
  UpdateAdoptionDto,
  CompleteAdoptionDto,
  petAdoptionControllerGetPetAdoption,
  brPetControllerFindAll,
  PetAdoptionDtoMethod,
  UserProfilePublicDto,
  parentRequestControllerGetPendingRequestCount,
  PetDto,
} from "@repo/api-client";
import { AxiosError, AxiosResponse } from "axios";
import FormItem from "./FormItem";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { cn, getChangedFields } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import { isNil, isNotNil, isUndefined, omitBy } from "es-toolkit";
import UserList from "@/app/(브리더스룸)/components/UserList";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import EditActionButtons from "./EditActionButtons";
import CompleteAdoptionModal from "./CompleteAdoptionModal";
import { useIsMobile } from "@/hooks/useMobile";

interface AdoptionInfoContentProps {
  petId: string;
  ownerId: string;
  initialAdoption: PetAdoptionDto | null;
  /** 데스크톱에서 분양완료 시 모달을 닫기 위한 콜백 */
  onClose?: () => void;
}

const AdoptionInfoContent = ({
  petId,
  ownerId,
  initialAdoption,
  onClose,
}: AdoptionInfoContentProps) => {
  const queryClient = useQueryClient();
  const { setAdoption } = useAdoptionStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [adoptionData, setAdoptionData] = useState<
    Omit<Partial<PetAdoptionDto>, "status"> & {
      status?: PetAdoptionDtoStatus | null;
      adoptionDate?: string;
      method?: PetAdoptionDtoMethod;
    }
  >({});

  const isMobile = useIsMobile();

  const isViewingMyPet = useIsMyPet(ownerId);

  const { data: queryAdoption } = useQuery({
    queryKey: [petAdoptionControllerGetPetAdoption.name, petId],
    queryFn: () => petAdoptionControllerGetPetAdoption(petId),
    enabled: !!petId && !initialAdoption,
    select: (response) => response.data.data,
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const adoption = queryAdoption ?? initialAdoption;

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
    mutationFn: ({ petId, data }: { petId: string; data: UpdateAdoptionDto }) =>
      petAdoptionControllerUpdatePetAdoption(petId, data),
  });

  const { mutateAsync: completeAdoption } = useMutation({
    mutationFn: ({ petId, data }: { petId: string; data: CompleteAdoptionDto }) =>
      adoptionHistoryControllerCompleteAdoption(petId, data),
  });

  // 변경된 필드 추출을 위한 설정
  const getChangedFieldsForAdoption = useCallback(
    (original: typeof adoption, current: typeof adoptionData): UpdateAdoptionDto => {
      if (!original) {
        // 기존 데이터가 없으면 현재 데이터 전체를 변경된 것으로 간주
        return omitBy(
          {
            price: current.price ? Number(current.price) : undefined,
            memo: current.memo,
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
          fields: ["price", "memo", "status", "buyer"],
          convertUndefinedToNull: true,
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
        status: UpdateAdoptionDtoStatus.ON_SALE,
        price: 0,
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

    try {
      setIsProcessing(true);

      const changedFields = getChangedFieldsForAdoption(adoption, adoptionData);

      if (Object.keys(changedFields).length === 0) {
        toast.info("변경된 사항이 없습니다.");
        setIsEditMode(false);
        return;
      }

      await updateAdoption({ petId, data: changedFields });

      queryClient.invalidateQueries({ queryKey: [brPetControllerFindAll.name] });

      setIsEditMode(false);
      toast.success("분양 정보가 성공적으로 업데이트되었습니다.");
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
  }, [queryClient, updateAdoption, adoptionData, petId, adoption, getChangedFieldsForAdoption]);

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

  const handleCompleteAdoption = useCallback(async () => {
    try {
      const { data } = await parentRequestControllerGetPendingRequestCount(petId);
      if (data.count > 0) {
        toast.error(
          `처리되지 않은 부모 요청(${data.count}건)이 있습니다. 모든 부모 요청을 처리한 후 다시 시도해주세요.`,
        );
        return;
      }
    } catch {
      toast.error("분양 가능 여부를 확인할 수 없습니다. 다시 시도해주세요.");
      return;
    }

    const defaultBuyer =
      adoptionData.status === UpdateAdoptionDtoStatus.ON_RESERVATION && adoptionData.buyer
        ? adoptionData.buyer
        : undefined;

    overlay.open(({ isOpen, close }) => (
      <CompleteAdoptionModal
        isOpen={isOpen}
        onClose={close}
        defaultPrice={adoptionData.price}
        defaultBuyer={defaultBuyer}
        defaultMemo={adoptionData.memo ?? undefined}
        onConfirm={async (data) => {
          try {
            setIsProcessing(true);
            await completeAdoption({
              petId,
              data: {
                adoptionDate: data.adoptionDate,
                method: data.method as CompleteAdoptionDto["method"],
                price: data.price,
                buyerId: data.buyerId,
                memo: data.memo,
              },
            });
            close();
            toast.success("분양이 완료되었습니다.");
            // 펫 목록 캐시에서 해당 펫 제거 (소유권 이전)
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
                    data: page.data.data.filter((p) => p.petId !== petId),
                  },
                })),
              };
            });
            onClose?.();
          } catch (error: unknown) {
            if (error instanceof AxiosError) {
              const message = error.response?.data?.message;
              const errorMessage = Array.isArray(message) ? message[0] : message;
              toast.error(errorMessage || "분양 완료에 실패했습니다. 다시 시도해주세요.");
            } else {
              toast.error("분양 완료에 실패했습니다. 다시 시도해주세요.");
            }
          } finally {
            setIsProcessing(false);
          }
        }}
      />
    ));
  }, [adoptionData, petId, completeAdoption, queryClient, onClose]);

  const showAdoptionInfo = useMemo(() => {
    return !(isNil(adoption) && !isEditMode);
  }, [adoption, isEditMode]);

  if (!adoption) return null;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">분양 정보</div>

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
              <div className="flex items-center gap-2">
                <SingleSelect
                  saveASAP
                  disabled={!isEditMode}
                  type="adoptionStatus"
                  initialItem={
                    !isEditMode && isNil(adoption) ? undefined : (adoptionData.status ?? "NONE")
                  }
                  onSelect={(item) => {
                    setAdoptionData((prev) => {
                      const nextStatus = item === "NONE" ? null : (item as string);
                      const isNextReservation =
                        nextStatus === UpdateAdoptionDtoStatus.ON_RESERVATION;
                      return {
                        ...prev,
                        status: nextStatus as PetAdoptionDtoStatus | null,
                        buyer: isNextReservation ? prev.buyer : undefined,
                      };
                    });
                  }}
                />
              </div>
            }
          />

          {adoptionData.status === UpdateAdoptionDtoStatus.ON_RESERVATION && (
            <FormItem
              label="예약자"
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

                  {isEditMode && (
                    <div className="flex gap-1">
                      <Button
                        className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600] text-white dark:bg-neutral-800/70"
                        onClick={handleSelectBuyer}
                      >
                        {isNil(adoptionData.buyer?.userId) ? "예약자 선택" : "변경"}
                      </Button>
                      {isNotNil(adoptionData.buyer?.userId) && (
                        <Button
                          variant="outline"
                          className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600]"
                          onClick={() =>
                            setAdoptionData((prev) => ({
                              ...prev,
                              buyer: undefined,
                            }))
                          }
                        >
                          삭제
                        </Button>
                      )}
                    </div>
                  )}
                </>
              }
            />
          )}

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
            label="메모"
            content={
              <div className="relative w-full pt-2">
                <textarea
                  className={cn(
                    `min-h-[100px] w-full rounded-xl bg-gray-100 p-3 text-left text-[14px] focus:ring-0 focus:outline-none dark:bg-neutral-800 dark:text-white`,
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
                  <div className="absolute right-4 bottom-4 text-[12px] text-gray-500 dark:text-gray-400">
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

      {isViewingMyPet && adoption && !isEditMode && (
        <Button
          className="w-full cursor-pointer rounded-xl bg-green-600 text-white hover:bg-green-700"
          disabled={isProcessing}
          onClick={handleCompleteAdoption}
        >
          개체 분양
        </Button>
      )}
    </div>
  );
};

export default AdoptionInfoContent;
