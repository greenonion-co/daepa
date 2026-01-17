"use client";

import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useMutation } from "@tanstack/react-query";
import { userControllerVerifyName } from "@repo/api-client";
import { AxiosError } from "axios";
import { CheckCircle2, CircleX, Info } from "lucide-react";
import { DUPLICATE_CHECK_STATUS } from "../../constants";
import { cn } from "@/lib/utils";

const NICKNAME_MAX_LENGTH = 15;
const NICKNAME_MIN_LENGTH = 2;

interface NicknameDuplicateCheckInputProps {
  value: string;
  onChange: (value: string) => void;
  duplicateCheckStatus: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS];
  setDuplicateCheckStatus: (
    status: (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS],
  ) => void;
  currentNickname?: string;
}

const NicknameDuplicateCheckInput = ({
  value,
  onChange,
  duplicateCheckStatus,
  setDuplicateCheckStatus,
  currentNickname,
}: NicknameDuplicateCheckInputProps) => {
  const { mutateAsync: verifyName, isPending: isVerifyPending } = useMutation({
    mutationFn: userControllerVerifyName,
  });

  const isDuplicateCheckDisabled =
    !value ||
    value.length < NICKNAME_MIN_LENGTH ||
    value.length > NICKNAME_MAX_LENGTH ||
    isVerifyPending ||
    duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.NONE ||
    value === currentNickname;

  const handleDuplicateCheck = async () => {
    if (!value || value.length < NICKNAME_MIN_LENGTH || value.length > NICKNAME_MAX_LENGTH) {
      toast.error("올바른 닉네임을 입력해주세요.");
      return;
    }

    if (value === currentNickname) {
      toast.error("현재 닉네임과 동일합니다.");
      return;
    }

    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.CHECKING);

    try {
      const response = await verifyName({ name: value });

      if (response.data.success) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.AVAILABLE);
        toast.success("사용 가능한 닉네임입니다.");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.DUPLICATE);
          toast.error("이미 사용중인 닉네임입니다.");
        } else if (error.response?.status === 400) {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
          const message = error.response?.data?.message;
          const errorMessage = Array.isArray(message) ? message[0] : message;
          toast.error(errorMessage || "유효하지 않은 닉네임입니다.");
        } else {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
          toast.error("중복확인 중 오류가 발생했습니다. 다시 시도해주세요.");
        }
      } else {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
        toast.error("중복확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value;
    if (newValue.length > NICKNAME_MAX_LENGTH) {
      newValue = newValue.slice(0, NICKNAME_MAX_LENGTH);
    }

    onChange(newValue);
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full gap-2">
        <div className="relative flex-1">
          <input
            id="nickname"
            type="text"
            className={cn(
              "h-[40px] w-full rounded-xl border border-gray-200 p-3 pr-12 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white",
            )}
            placeholder="닉네임을 입력하세요"
            maxLength={NICKNAME_MAX_LENGTH}
            value={value}
            onChange={handleChange}
            autoFocus
          />
          {value && (
            <div className="absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gray-400">
              {value.length}/{NICKNAME_MAX_LENGTH}
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
            <Info className="h-4 w-4" />
            {NICKNAME_MIN_LENGTH}자 이상 {NICKNAME_MAX_LENGTH}자 이하
          </div>
        )}

        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.AVAILABLE && (
          <div className="flex items-center gap-1 text-[12px] text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            사용 가능한 닉네임입니다
          </div>
        )}

        {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.DUPLICATE && (
          <div className="flex items-center gap-1 text-[12px] text-red-500 dark:text-red-400">
            <CircleX className="h-4 w-4" />
            이미 사용중인 닉네임입니다
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

export default NicknameDuplicateCheckInput;
