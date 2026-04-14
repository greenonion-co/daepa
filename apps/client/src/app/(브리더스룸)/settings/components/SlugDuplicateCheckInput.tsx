"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useState } from "react";
import { AxiosError } from "axios";
import { CheckCircle2, CircleX, Info } from "lucide-react";
import { DUPLICATE_CHECK_STATUS } from "../../constants";
import { cn } from "@/lib/utils";
import { userControllerVerifySlug } from "@repo/api-client";

const SLUG_MAX_LENGTH = 20;
const SLUG_MIN_LENGTH = 3;
const SLUG_PATTERN = /^[a-zA-Z0-9_]+$/;

interface SlugDuplicateCheckInputProps {
  value: string;
  onChange: (value: string) => void;
  duplicateCheckStatus: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS];
  setDuplicateCheckStatus: (
    status: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS],
  ) => void;
  currentSlug?: string;
}

const SlugDuplicateCheckInput = ({
  value,
  onChange,
  duplicateCheckStatus,
  setDuplicateCheckStatus,
  currentSlug,
}: SlugDuplicateCheckInputProps) => {
  const [isVerifyPending, setIsVerifyPending] = useState(false);

  const isValidFormat = value.length >= SLUG_MIN_LENGTH && SLUG_PATTERN.test(value);

  const isDuplicateCheckDisabled =
    !value ||
    !isValidFormat ||
    value.length > SLUG_MAX_LENGTH ||
    isVerifyPending ||
    duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.NONE ||
    value === currentSlug;

  const handleDuplicateCheck = async () => {
    if (!isValidFormat) {
      toast.error("올바른 쇼룸 주소를 입력해주세요.");
      return;
    }

    if (value === currentSlug) {
      toast.error("현재 쇼룸 주소와 동일합니다.");
      return;
    }

    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.CHECKING);
    setIsVerifyPending(true);

    try {
      await userControllerVerifySlug({ slug: value });
      setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.AVAILABLE);
      toast.success("사용 가능한 쇼룸 주소입니다.");
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.DUPLICATE);
          toast.error("이미 사용 중인 쇼룸 주소입니다.");
        } else {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
          toast.error("중복확인 중 오류가 발생했습니다.");
        }
      } else {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
        toast.error("중복확인 중 오류가 발생했습니다.");
      }
    } finally {
      setIsVerifyPending(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value.replace(/[^a-zA-Z0-9_]/g, "");
    if (newValue.length > SLUG_MAX_LENGTH) {
      newValue = newValue.slice(0, SLUG_MAX_LENGTH);
    }

    onChange(newValue);
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full gap-2">
        <div className="relative flex-1">
          <input
            id="showroom-slug"
            type="text"
            className={cn(
              "h-[40px] w-full rounded-xl border border-gray-200 p-3 pr-12 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white",
            )}
            placeholder="쇼룸 주소 입력"
            maxLength={SLUG_MAX_LENGTH}
            value={value}
            onChange={handleChange}
            autoFocus
          />
          {value && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400">
              {value.length}/{SLUG_MAX_LENGTH}
            </div>
          )}
        </div>
        <Button
          type="button"
          onClick={handleDuplicateCheck}
          disabled={isDuplicateCheckDisabled}
          className="h-[40px] rounded-xl bg-blue-600 px-3 text-[13px] hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-blue-800 dark:text-blue-100"
        >
          {isVerifyPending ? (
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
              확인중
            </div>
          ) : (
            "중복확인"
          )}
        </Button>
      </div>

      <div className="min-h-[20px]">
        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.NONE && (
          <div className="flex items-center gap-1 text-[12px] text-gray-500">
            <Info className="h-4 w-4 shrink-0" />
            영문, 숫자, 밑줄(_) {SLUG_MIN_LENGTH}~{SLUG_MAX_LENGTH}자 (대소문자 구분)
          </div>
        )}

        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.AVAILABLE && (
          <div className="flex items-center gap-1 text-[12px] text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            사용 가능한 쇼룸 주소입니다
          </div>
        )}

        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.DUPLICATE && (
          <div className="flex items-center gap-1 text-[12px] text-red-500 dark:text-red-400">
            <CircleX className="h-4 w-4" />
            이미 사용 중인 쇼룸 주소입니다
          </div>
        )}

        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.CHECKING && (
          <div className="flex items-center gap-1 text-[12px] text-blue-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
            중복확인 중...
          </div>
        )}
      </div>
    </div>
  );
};

export default SlugDuplicateCheckInput;
