"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import NumberField from "@/app/(브리더스룸)/components/Form/NumberField";
import { SELECTOR_CONFIGS } from "@/app/(브리더스룸)/constants";
import UserList from "@/app/(브리더스룸)/components/UserList";
import FormItem from "./FormItem";
import { UserProfilePublicDto } from "@repo/api-client";
import { isNil, isNotNil } from "es-toolkit";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import { DateTime } from "luxon";

interface CompleteAdoptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    adoptionDate: string | null;
    method: string | null;
    price: number | null;
    buyerId: string | null;
    memo: string | null;
  }) => void;
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

  const getMethodLabel = (key: string | null) =>
    SELECTOR_CONFIGS.adoptionMethod.selectList.find((item) => item.key === key)?.value ?? "-";

  const handleConfirm = () => {
    const data = {
      adoptionDate: adoptionDate || null,
      method: method === "NONE" ? null : method,
      price: price ?? null,
      buyerId: buyer?.userId ?? null,
      memo: memo || null,
    };

    overlay.open(({ isOpen, close }) => (
      <ConfirmAdoptionDialog
        isOpen={isOpen}
        onClose={close}
        data={data}
        buyerName={buyer?.name}
        getMethodLabel={getMethodLabel}
        onConfirm={() => {
          close();
          onConfirm(data);
        }}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle className="text-base font-semibold">개체 분양</DialogTitle>

        <div className="space-y-3">
          <FormItem
            label="분양 날짜"
            content={
              <input
                type="date"
                value={adoptionDate}
                onChange={(e) => setAdoptionDate(e.target.value)}
                className="h-[32px] rounded-md border border-gray-200 px-2 text-[14px] font-[500] dark:border-gray-700 dark:bg-neutral-800 dark:text-white"
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
                          ? "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-400"
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
              <div className="flex items-center gap-1">
                {isNotNil(buyer?.userId) && (
                  <div className="mr-1 flex h-[32px] w-fit items-center gap-1 rounded-lg bg-blue-100 px-2 py-1 text-[14px] font-[500] text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    {buyer?.name}
                  </div>
                )}
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
            }
          />

          <FormItem
            label="메모"
            content={
              <div className="relative w-full">
                <textarea
                  className="min-h-[80px] w-full rounded-xl bg-gray-100 p-3 text-left text-[14px] focus:ring-0 focus:outline-none dark:bg-neutral-800 dark:text-white"
                  value={memo}
                  maxLength={500}
                  placeholder="메모를 입력하세요"
                  onChange={(e) => setMemo(e.target.value)}
                  style={{ height: "auto" }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = "auto";
                    target.style.height = `${target.scrollHeight}px`;
                  }}
                />
                <div className="absolute right-3 bottom-2 text-[12px] text-gray-500 dark:text-gray-400">
                  {memo.length}/{500}
                </div>
              </div>
            }
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            취소
          </Button>
          <Button onClick={handleConfirm} className="cursor-pointer">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmAdoptionDialog = ({
  isOpen,
  onClose,
  data,
  buyerName,
  getMethodLabel,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  data: {
    adoptionDate: string | null;
    method: string | null;
    price: number | null;
    buyerId: string | null;
    memo: string | null;
  };
  buyerName?: string;
  getMethodLabel: (key: string | null) => string;
  onConfirm: () => void;
}) => {
  const [agreed, setAgreed] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogTitle className="text-base font-semibold text-red-600">
          정말 분양하시겠습니까?
        </DialogTitle>

        <div className="flex flex-col rounded-lg border border-dashed border-red-500 p-2 text-[13px] text-red-500">
          <span>중요!</span>
          <span>개체의 소유권이 완전히 이전됩니다.</span>
          <span>개체 정보 수정 및 분양 취소는 불가능합니다.</span>
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

        <div className="space-y-2 rounded-xl bg-gray-50 p-3 text-[13px] dark:bg-neutral-800">
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">분양 날짜</span>
            <span className="font-[500]">{data.adoptionDate ?? "-"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">분양 방식</span>
            <span className="font-[500]">{getMethodLabel(data.method)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">가격</span>
            <span className="font-[500]">
              {isNotNil(data.price) ? `${data.price.toLocaleString()}원` : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 dark:text-gray-400">입양자</span>
            <span className="font-[500]">{buyerName ?? "-"}</span>
          </div>
          {data.memo && (
            <div className="flex justify-between">
              <span className="shrink-0 text-gray-500 dark:text-gray-400">메모</span>
              <span className="ml-4 truncate font-[500]">{data.memo}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            취소
          </Button>
          <Button
            variant="destructive"
            className="cursor-pointer"
            disabled={!agreed}
            onClick={onConfirm}
          >
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CompleteAdoptionModal;
