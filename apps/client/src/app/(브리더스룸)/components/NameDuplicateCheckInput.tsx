import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { petControllerVerifyName } from "@repo/api-client";
import { AxiosError } from "axios";
import { CheckCircle2, CircleX, Info } from "lucide-react";
import { useNameStore } from "../store/name";
import { usePetStore } from "../pet/store/pet";
import { DUPLICATE_CHECK_STATUS } from "../constants";
import { cn } from "@/lib/utils";

const NAME_MAX_LENGTH = 15;
const NAME_MIN_LENGTH = 2;

interface NameInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  errorMessage?: string;
  buttonClassName?: string;
}
const NameDuplicateCheckInput = ({
  value,
  onChange,
  errorMessage,
  disabled,
  ...props
}: NameInputProps) => {
  const { mutateAsync: mutateVerifyName, isPending: isVerifyPending } = useMutation({
    mutationFn: petControllerVerifyName,
  });
  const { errors, setErrors } = usePetStore();
  const { duplicateCheckStatus, setDuplicateCheckStatus } = useNameStore();
  const isDuplicateCheckDisabled =
    !value ||
    !!errorMessage ||
    isVerifyPending ||
    duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.NONE;

  // 중복확인 함수
  const handleDuplicateCheck = async () => {
    if (!value || errorMessage || typeof value !== "string") {
      toast.error("올바른 이름을 입력해주세요.");
      return;
    }

    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.CHECKING);

    try {
      const response = await mutateVerifyName({ name: value });

      if (response.data.success) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.AVAILABLE);
        toast.success("사용 가능한 이름입니다.");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        if (error.response?.status === 409) {
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.DUPLICATE);
          toast.error("이미 사용중인 이름입니다.");
        } else if (error.response?.status === 400) {
          // 서버 유효성 검증 에러 (예: DELETED_ 접두사)
          setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
          const message = error.response?.data?.message;
          const errorMessage = Array.isArray(message) ? message[0] : message;
          toast.error(errorMessage || "유효하지 않은 이름입니다.");
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
    if (e.target.value.length > NAME_MAX_LENGTH) {
      e.target.value = e.target.value.slice(0, NAME_MAX_LENGTH);
    }

    onChange?.(e);
  };

  // 이름이 변경되면 중복확인 상태 초기화
  useEffect(() => {
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
    setErrors({ ...errors, name: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, setDuplicateCheckStatus, setErrors]);

  return (
    <div className="w-full space-y-0.5">
      <div className="flex w-full flex-1 gap-2">
        <div className="relative w-full">
          <input
            id="name"
            type="text"
            className={cn(
              "h-[32px] w-full rounded-md border border-gray-200 p-2 placeholder:font-[500]",
              disabled && "border-none",
            )}
            maxLength={NAME_MAX_LENGTH}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            autoFocus
            {...props}
          />
          {!disabled && value && typeof value === "string" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {value.length}/{NAME_MAX_LENGTH}
            </div>
          )}
        </div>
        {!disabled && (
          <Button
            type="button"
            onClick={handleDuplicateCheck}
            disabled={isDuplicateCheckDisabled}
            className="h-[32px] bg-blue-600 px-2 text-[12px] hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 dark:bg-blue-800 dark:text-blue-100"
          >
            {isVerifyPending ? (
              <div className="flex items-center gap-1">
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></div>
                확인중
              </div>
            ) : (
              <div className="flex items-center gap-1">중복확인</div>
            )}
          </Button>
        )}
      </div>

      {!disabled && (
        <div>
          {!errorMessage && duplicateCheckStatus === DUPLICATE_CHECK_STATUS.NONE && (
            <div className="flex items-center gap-1 text-[12px] text-gray-500">
              <Info className="h-4 w-4" />
              이름은 {NAME_MIN_LENGTH}자 이상 {NAME_MAX_LENGTH}자 이하여야 합니다
            </div>
          )}

          {errorMessage && (
            <div className="flex items-center gap-1 text-[12px] text-red-500">
              <Info className="h-4 w-4" />
              {errorMessage}
            </div>
          )}

          {/* 중복확인 결과 표시 */}
          {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.AVAILABLE && (
            <div className="flex items-center gap-1 text-[12px] text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              사용 가능한 이름입니다
            </div>
          )}

          {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.DUPLICATE && (
            <div className="flex items-center gap-1 text-[12px] text-red-500 dark:text-red-600">
              <CircleX className="h-4 w-4" />
              이미 사용중인 이름입니다
            </div>
          )}

          {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.CHECKING && (
            <div className="flex items-center gap-1 text-[12px] text-blue-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
              중복확인 중...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NameDuplicateCheckInput;
