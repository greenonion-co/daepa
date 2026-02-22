"use client";

import {
  petAdoptionControllerUpdatePetAdoption,
  adoptionHistoryControllerCompleteAdoption,
  PetAdoptionDto,
  PetAdoptionDtoStatus,
  AdoptionDtoStatus,
  UpdateAdoptionDtoStatus,
  UpdateAdoptionDto,
  CompleteAdoptionDto,
  petAdoptionControllerGetPetAdoption,
  brPetControllerFindAll,
  UserProfilePublicDto,
  parentRequestControllerGetPendingRequestCount,
  PetDto,
} from "@repo/api-client";
import { AxiosError, AxiosResponse } from "axios";
import FormItem from "./FormItem";
import SingleSelect from "@/app/(브리더스룸)/components/selector/SingleSelect";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import { isNil, isNotNil } from "es-toolkit";
import UserList from "@/app/(브리더스룸)/components/UserList";
import { overlay } from "overlay-kit";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import { InfiniteData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { patchPetListCache } from "../../utils/patchPetListCache";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import CompleteAdoptionModal from "./CompleteAdoptionModal";
import { useIsMobile } from "@/hooks/useMobile";
import { useRouter } from "next/navigation";
import { useRegisterFlush } from "./FlushContext";

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
  const router = useRouter();
  const { setAdoption } = useAdoptionStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [adoptionData, setAdoptionData] = useState<
    Omit<Partial<PetAdoptionDto>, "status" | "reservedUser"> & {
      status?: PetAdoptionDtoStatus | null;
      reservedUser?: UserProfilePublicDto | null;
    }
  >({});

  const isMobile = useIsMobile();
  const isViewingMyPet = useIsMyPet(ownerId);
  const adoptionDataRef = useRef(adoptionData);
  adoptionDataRef.current = adoptionData;

  const { data: queryAdoption } = useQuery({
    queryKey: [petAdoptionControllerGetPetAdoption.name, petId],
    queryFn: () => petAdoptionControllerGetPetAdoption(petId),
    enabled: !!petId && !initialAdoption,
    select: (response) => response.data.data,
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const adoption = queryAdoption ?? initialAdoption;
  const adoptionRef = useRef(adoption);
  useEffect(() => {
    if (adoption) adoptionRef.current = adoption;
  }, [adoption]);

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

  useEffect(() => {
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

  // 단일 필드 자동 저장
  const autoSave = useCallback(
    async (data: UpdateAdoptionDto) => {
      if (!petId) return;
      const prevAdoption = adoptionRef.current;
      // 낙관적 업데이트: API 호출 전에 리스트 캐시 + 헤더 즉시 반영
      if (prevAdoption) {
        patchPetListCache(queryClient, petId, {
          adoption: { ...prevAdoption, ...data } as PetAdoptionDto,
        } as Partial<PetDto>);
      }
      if ("status" in data || "price" in data) {
        setAdoption({
          petId,
          status: ("status" in data ? data.status : prevAdoption?.status) as
            | AdoptionDtoStatus
            | undefined,
          price: ("price" in data ? data.price : prevAdoption?.price) ?? undefined,
        });
      }
      try {
        await updateAdoption({ petId, data });
        // 저장 성공 시 로컬 ref 업데이트 (불필요한 재조회 방지)
        if (adoptionRef.current) {
          adoptionRef.current = { ...adoptionRef.current, ...data } as PetAdoptionDto;
        }
      } catch (error: unknown) {
        console.error("분양 정보 수정 실패:", error);
        // 실패 시 롤백
        if (prevAdoption) {
          patchPetListCache(queryClient, petId, {
            adoption: prevAdoption as PetAdoptionDto,
          } as Partial<PetDto>);
          if ("status" in data || "price" in data) {
            setAdoption({
              petId,
              status: prevAdoption.status as AdoptionDtoStatus | undefined,
              price: prevAdoption.price ?? undefined,
            });
          }
        }
        if (error instanceof AxiosError) {
          const message = error.response?.data?.message;
          const errorMessage = Array.isArray(message) ? message[0] : message;
          toast.error(errorMessage || "저장에 실패했습니다.");
        } else {
          toast.error("저장에 실패했습니다.");
        }
      }
    },
    [petId, updateAdoption, setAdoption, queryClient],
  );

  // 분양 상태 변경 (즉시 저장)
  const handleStatusChange = useCallback(
    (item: string | number) => {
      const nextStatus = item === "NONE" ? null : (item as string);
      const isNextReservation = nextStatus === UpdateAdoptionDtoStatus.ON_RESERVATION;
      setAdoptionData((prev) => ({
        ...prev,
        status: nextStatus as PetAdoptionDtoStatus | null,
        reservedUser: isNextReservation ? prev.reservedUser : undefined,
      }));
      const update: UpdateAdoptionDto = {
        status: nextStatus as UpdateAdoptionDtoStatus,
      };
      if (nextStatus !== UpdateAdoptionDtoStatus.ON_RESERVATION) {
        update.reservedUserId = null;
      }
      autoSave(update);
    },
    [autoSave],
  );

  // 예약자 선택 (즉시 저장)
  const handleSelectBuyer = useCallback(() => {
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="rounded-3xl p-4 dark:bg-neutral-900">
          <DialogTitle className="h-4 text-base font-semibold text-gray-800 dark:text-gray-200">
            입양자를 선택해주세요.
          </DialogTitle>
          <UserList
            selectedUserId={adoptionDataRef.current.reservedUser?.userId}
            onSelect={(user) => {
              setAdoptionData((prev) => ({ ...prev, reservedUser: user }));
              autoSave({ reservedUserId: user.userId });
              close();
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  }, [autoSave]);

  // 예약자 삭제 (즉시 저장)
  const handleDeleteBuyer = useCallback(() => {
    setAdoptionData((prev) => ({ ...prev, reservedUser: undefined }));
    autoSave({ reservedUserId: null });
  }, [autoSave]);

  // blur 시 저장 (가격, 메모)
  // 연속 변경(+/- 버튼 연타 등)은 디바운스로 마지막 값만 저장
  const blurTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
  const handleBlurSave = useCallback(
    (field: "price" | "memo") => {
      clearTimeout(blurTimersRef.current[field]);
      blurTimersRef.current[field] = setTimeout(() => {
        const current = adoptionDataRef.current;
        const original = adoptionRef.current;

        const currentValue = current[field];
        const originalValue = original?.[field];

        if (currentValue === originalValue) return;

        if (field === "price") {
          autoSave({ price: currentValue ? Number(currentValue) : 0 });
        } else {
          autoSave({ memo: (currentValue as string) ?? null });
        }
      }, 500);
    },
    [autoSave],
  );

  // 미저장 blur 필드(price, memo)를 감지하고 서버에 저장
  const flushUnsavedFields = useCallback(() => {
    const latest = adoptionRef.current;
    if (!latest || !petId) return;

    // 디바운스 타이머 정리
    Object.values(blurTimersRef.current).forEach(clearTimeout);

    const current = adoptionDataRef.current;
    const unsaved: UpdateAdoptionDto = {};

    // price 비교
    const currentPrice = current.price;
    const originalPrice = latest.price;
    if (currentPrice !== originalPrice) {
      unsaved.price = currentPrice ? Number(currentPrice) : 0;
    }

    // memo 비교
    const currentMemo = current.memo ?? null;
    const originalMemo = latest.memo ?? null;
    if (currentMemo !== originalMemo) {
      unsaved.memo = currentMemo;
    }

    if (Object.keys(unsaved).length > 0) {
      patchPetListCache(queryClient, petId, {
        adoption: { ...latest, ...unsaved } as PetAdoptionDto,
      });
      return petAdoptionControllerUpdatePetAdoption(petId, unsaved)
        .then(() => {})
        .catch(() => {
          patchPetListCache(queryClient, petId, {
            adoption: latest as PetAdoptionDto,
          } as Partial<PetDto>);
        });
    }
  }, [queryClient, petId]);

  // 모달 닫힐 때 flush (언마운트 전에 호출됨)
  useRegisterFlush(flushUnsavedFields);

  // 페이지 이동 등 언마운트 시 fallback
  useEffect(() => {
    const timers = blurTimersRef.current;
    return () => {
      Object.values(timers).forEach(clearTimeout);
      flushUnsavedFields();
    };
  }, [flushUnsavedFields]);

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

    const reservedUser =
      adoptionData.status === UpdateAdoptionDtoStatus.ON_RESERVATION && adoptionData.reservedUser
        ? adoptionData.reservedUser
        : undefined;

    overlay.open(({ isOpen, close }) => (
      <CompleteAdoptionModal
        isOpen={isOpen}
        onClose={close}
        defaultPrice={adoptionData.price}
        defaultBuyer={reservedUser}
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

            if (isMobile) {
              router.replace("/pet");
            } else {
              onClose?.();
            }
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
  }, [adoptionData, petId, completeAdoption, queryClient, onClose, isMobile, router]);

  if (!adoption) return null;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">분양 정보</div>

      {/* 분양 상태 */}
      <FormItem
        label="분양 상태"
        content={
          <div className="flex items-center gap-2">
            <SingleSelect
              variant="form"
              disabled={!isViewingMyPet}
              type="adoptionStatus"
              initialItem={adoptionData.status ?? "NONE"}
              onSelect={handleStatusChange}
            />
          </div>
        }
      />

      {adoptionData.status === UpdateAdoptionDtoStatus.ON_RESERVATION && (
        <FormItem
          label="예약자"
          content={
            <>
              {!(isNil(adoptionData.reservedUser?.userId) && isViewingMyPet) && (
                <div
                  className={cn(
                    "mr-1 flex h-[32px] w-fit items-center gap-1 rounded-lg px-2 py-1 text-[14px] font-[500]",
                    adoptionData.reservedUser?.userId
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400"
                      : "",
                  )}
                >
                  {isNil(adoptionData.reservedUser?.userId) ? (
                    "-"
                  ) : (
                    <div className="flex items-center gap-1">{adoptionData.reservedUser?.name}</div>
                  )}
                </div>
              )}

              {isViewingMyPet && (
                <div className="flex gap-1">
                  <Button
                    className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600] text-white dark:bg-neutral-800/70"
                    onClick={handleSelectBuyer}
                  >
                    {isNil(adoptionData.reservedUser?.userId) ? "예약자 선택" : "변경"}
                  </Button>
                  {isNotNil(adoptionData.reservedUser?.userId) && (
                    <Button
                      variant="outline"
                      className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600]"
                      onClick={handleDeleteBuyer}
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
            disabled={!isViewingMyPet}
            value={
              isNotNil(adoptionData.price)
                ? isViewingMyPet
                  ? String(adoptionData.price)
                  : adoptionData.price.toLocaleString()
                : isViewingMyPet
                  ? ""
                  : "-"
            }
            setValue={(value) => {
              setAdoptionData((prev) => ({
                ...prev,
                price: value.value === "" ? undefined : Number(value.value),
              }));
            }}
            onBlur={() => handleBlurSave("price")}
            inputClassName={cn(
              " h-[32px] font-[600] w-full rounded-md border border-gray-200 dark:border-gray-700 placeholder:font-[500] pl-2",
              !isViewingMyPet && "border-none",
            )}
            field={{ name: "adoption.price", unit: "원", type: "number" }}
            stepAmount={10000}
          />
        }
      />

      <FormItem
        label="메모"
        content={
          <div className="w-full">
            <textarea
              className={cn(
                "min-h-[80px] w-full resize-none rounded-md border border-gray-200 p-2 text-sm font-[500] placeholder:font-[500] disabled:bg-transparent dark:border-gray-700 dark:bg-transparent dark:text-white",
                !isViewingMyPet && "border-none",
              )}
              value={String(adoptionData.memo || "")}
              maxLength={500}
              placeholder={isViewingMyPet ? "메모를 입력하세요" : "-"}
              onChange={(e) =>
                setAdoptionData((prev) => ({
                  ...prev,
                  memo: e.target.value,
                }))
              }
              onBlur={() => handleBlurSave("memo")}
              disabled={!isViewingMyPet}
            />
            {isViewingMyPet && (
              <div className="mt-1 text-right text-xs text-gray-400">
                {adoptionData.memo?.length ?? 0}/500
              </div>
            )}
          </div>
        }
      />

      {isViewingMyPet && adoption && (
        <Button
          className="h-10 w-full cursor-pointer rounded-xl bg-green-600 text-[15px] font-bold text-white hover:bg-green-700"
          disabled={isProcessing}
          onClick={handleCompleteAdoption}
        >
          분양 완료하기
        </Button>
      )}
    </div>
  );
};

export default AdoptionInfoContent;
