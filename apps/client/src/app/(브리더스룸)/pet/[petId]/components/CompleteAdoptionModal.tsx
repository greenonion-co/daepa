"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import { SELECTOR_CONFIGS } from "@/app/(브리더스룸)/constants";
import UserList from "@/app/(브리더스룸)/components/UserList";
import FormItem from "./FormItem";
import { UserProfilePublicDto } from "@repo/api-client";
import { isNil, isNotNil } from "es-toolkit";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import { DateTime } from "luxon";
import CalendarInput from "@/app/(브리더스룸)/hatching/components/CalendarInput";

interface CompleteAdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    adoptionDate: string | null;
    method: string | null;
    price: number | null;
    buyerId: string | null;
    memo: string | null;
  }) => void | Promise<void>;
  defaultPrice?: number;
  defaultBuyer?: UserProfilePublicDto;
  defaultMemo?: string;
}

const CompleteAdoptionModal = ({
  isOpen,
  onClose,
  onConfirm,
  defaultPrice,
  defaultBuyer,
  defaultMemo,
}: CompleteAdoptionModalProps) => {
  const [adoptionDate, setAdoptionDate] = useState(DateTime.now().toFormat("yyyy-MM-dd"));
  const [method, setMethod] = useState<string | null>(null);
  const [price, setPrice] = useState<number | undefined>(defaultPrice);
  const [buyer, setBuyer] = useState<UserProfilePublicDto | undefined>(defaultBuyer);
  const [memo, setMemo] = useState(defaultMemo ?? "");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelectBuyer = () => {
    overlay.open(({ isOpen, close }) => (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent className="rounded-3xl p-4 dark:bg-neutral-900">
          <DialogTitle className="h-4 text-base font-semibold text-gray-800 dark:text-gray-200">
            입양자를 선택해주세요.
          </DialogTitle>
          <UserList
            selectedUserId={buyer?.userId}
            onSelect={(user) => {
              setBuyer(user);
              close();
            }}
          />
        </DialogContent>
      </Dialog>
    ));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm({
        adoptionDate: adoptionDate || null,
        method: method === "NONE" ? null : method,
        price: price ?? null,
        buyerId: buyer?.userId ?? null,
        memo: memo || null,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={isSubmitting ? undefined : onClose}>
      <DialogContent className="rounded-3xl sm:max-w-[500px]">
        <DialogTitle className="text-base font-semibold">개체 분양</DialogTitle>

        <div className="rounded-xl bg-red-50 p-3 text-[13px] text-red-600 dark:bg-red-950/30 dark:text-red-400">
          <p className="font-[600]">중요!</p>
          <p>개체의 소유권이 완전히 이전됩니다.</p>
          <p>개체 정보 수정 및 분양 취소는 불가능합니다.</p>
        </div>

        <div className="space-y-3">
          <FormItem
            label="분양 날짜"
            content={
              <CalendarInput
                value={adoptionDate}
                onSelect={(date) => {
                  if (!date) return;
                  setAdoptionDate(DateTime.fromJSDate(date).toFormat("yyyy-MM-dd"));
                }}
              />
            }
          />

          <FormItem
            label="분양 방식"
            content={
              <div className="flex flex-wrap gap-2">
                {SELECTOR_CONFIGS.adoptionMethod.selectList
                  .filter((item) => item.key !== "NONE")
                  .map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={cn(
                        "cursor-pointer rounded-lg border px-3 py-1.5 text-[13px] font-[500] transition-colors",
                        method === item.key
                          ? "border-blue-500 bg-blue-500 text-white dark:border-blue-400 dark:bg-blue-600 dark:text-white"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-neutral-800",
                      )}
                      onClick={() => setMethod(method === item.key ? null : item.key)}
                    >
                      {item.value}
                    </button>
                  ))}
              </div>
            }
          />

          <FormItem
            label="가격"
            content={
              <NumberField
                value={isNotNil(price) ? String(price) : ""}
                setValue={(value) => setPrice(value.value === "" ? undefined : Number(value.value))}
                inputClassName="h-[32px] font-[600] w-full rounded-md border border-gray-200 dark:border-gray-700 placeholder:font-[500] pl-2"
                field={{ name: "adoption.price", unit: "원", type: "number" }}
                stepAmount={10000}
              />
            }
          />

          <FormItem
            label="입양자"
            content={
              <>
                {isNotNil(buyer?.userId) && (
                  <div className="mr-1 flex h-[32px] w-fit items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-[14px] font-[500] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    {buyer?.name}
                  </div>
                )}
                <div className="flex gap-1">
                  <Button
                    className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600] text-white dark:bg-neutral-800/70"
                    onClick={handleSelectBuyer}
                  >
                    {isNil(buyer?.userId) ? "사용자 검색" : "변경"}
                  </Button>
                  {isNotNil(buyer?.userId) && (
                    <Button
                      variant="outline"
                      className="h-8 cursor-pointer rounded-lg px-2 text-[12px] font-[600]"
                      onClick={() => setBuyer(undefined)}
                    >
                      삭제
                    </Button>
                  )}
                </div>
              </>
            }
          />

          <FormItem
            label="메모"
            content={
              <div className="w-full">
                <textarea
                  value={memo}
                  maxLength={100}
                  placeholder="메모를 입력하세요"
                  onChange={(e) => setMemo(e.target.value)}
                  className="min-h-[80px] w-full resize-none rounded-md border border-gray-200 p-2 text-sm font-[500] placeholder:font-[500] dark:border-gray-700 dark:bg-transparent"
                />
                <div className="mt-1 text-right text-xs text-gray-400">
                  {memo.length}/100
                </div>
              </div>
            }
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="h-4 w-4 cursor-pointer rounded border-gray-300"
          />
          <span className="text-gray-700 dark:text-gray-300">
            위 사실을 인지하였으며 이에 동의합니다.
          </span>
        </label>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="cursor-pointer rounded-xl"
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            className="cursor-pointer rounded-xl bg-red-600 text-white hover:bg-red-700"
            disabled={!agreed || isSubmitting}
            onClick={handleConfirm}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "분양하기"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteAdoptionModal;
