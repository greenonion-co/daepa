"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { userControllerCreateInitUserInfo } from "@repo/api-client";
import { AxiosError } from "axios";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";
import Image from "next/image";
import NameInput from "@/app/(브리더스룸)/components/NameInput";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { useIsMobile } from "@/hooks/useMobile";

const NICKNAME_MAX_LENGTH = 15;
const NICKNAME_MIN_LENGTH = 2;

// 닉네임 및 사업자 여부 검증 스키마
const registerSchema = z.object({
  nickname: z
    .string()
    .min(NICKNAME_MIN_LENGTH, `닉네임/업체명은 ${NICKNAME_MIN_LENGTH}자 이상 입력해주세요.`)
    .max(NICKNAME_MAX_LENGTH, `닉네임/업체명은 ${NICKNAME_MAX_LENGTH}자 이하로 입력해주세요.`)
    .regex(
      /^[가-힣a-zA-Z0-9\s!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]+$/,
      "닉네임/업체명은 한글, 영문, 숫자, 특수문자 사용 가능합니다.",
    )
    .refine((value) => !/^\d+$/.test(value), {
      message: "닉네임/업체명은 숫자로만 구성될 수 없습니다.",
    }),
  isSeller: z.boolean({
    required_error: "사업자 여부를 선택해주세요.",
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { duplicateCheckStatus } = useNameStore();

  const { mutateAsync: mutateRegister, isPending: isRegisterPending } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    watch,
    setValue,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: "onChange",
    defaultValues: {
      isSeller: false,
    },
  });

  const nickname = watch("nickname");
  const isSeller = watch("isSeller");

  const onSubmit = async (data: RegisterFormData) => {
    // 중복확인이 완료되지 않았거나 중복인 경우 제출 방지
    if (duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
      toast.error("닉네임 중복확인을 완료해주세요.");
      return;
    }

    try {
      const response = await mutateRegister({
        name: data.nickname,
        isBiz: data.isSeller,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        const redirectUrl = localStorage.getItem("redirectUrl");
        if (redirectUrl) {
          localStorage.removeItem("redirectUrl");
          router.replace(redirectUrl);
        } else {
          router.replace("/pet");
        }

        toast.success("로그인에 성공했습니다.");
      }
    } catch (error: unknown) {
      console.error("회원정보 등록 실패:", error);

      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorMessage = Array.isArray(message) ? message[0] : message;
        toast.error(errorMessage || "회원정보 등록에 실패했습니다. 다시 시도해주세요.");
      } else {
        toast.error("회원정보 등록에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const inputClassName = cn(
    `text-[15px] w-full h-9 pr-1 px-3 text-left focus:border-gray-400 focus:border-[1.8px] border-[1.2px] border rounded-md border-input focus:outline-none focus:ring-0 text-gray-400 dark:text-gray-400
    transition-all duration-300 ease-in-out placeholder:text-gray-400 flex items-center `,
    errors.nickname?.message && "border-red-500 focus:border-red-500",
  );

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent bg-gradient-to-b from-[#e5cf94] to-white dark:bg-black">
      <div className="my-5 w-[90vw] max-w-md">
        <div className="mb-5 text-center text-3xl font-bold text-gray-800/90 dark:text-white">
          회원정보 설정
          <div className="text-[14px] font-[500] text-gray-600 dark:text-gray-400">
            서비스 이용을 위해 필요한 정보를 설정해주세요
          </div>
        </div>

        <div className="rounded-3xl bg-gradient-to-b from-white to-gray-50 p-5 dark:border dark:border-gray-700 dark:bg-gray-800/80">
          <div
            className={cn(
              "flex h-full w-full items-center justify-center py-5",
              isMobile && "py-2",
            )}
          >
            <Image src="/assets/lizard.png" alt="회원정보 설정 로고" width={100} height={100} />
          </div>
          <div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 닉네임 입력 */}
              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  닉네임/업체명
                </label>
                <NameInput
                  id="nickname"
                  type="text"
                  placeholder="닉네임/업체명을 입력해주세요"
                  className={cn(inputClassName, "text-black dark:text-white")}
                  value={nickname || ""}
                  {...register("nickname")}
                  onChange={(e) => {
                    register("nickname").onChange(e);
                  }}
                  errorMessage={errors.nickname?.message || ""}
                />
              </div>

              {/* 사업자 여부 선택 */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  사업자 여부
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("isSeller", false)}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-lg text-sm transition-all duration-200",
                      isSeller === false
                        ? "bg-black font-semibold text-white dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500",
                    )}
                  >
                    일반 사용자
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("isSeller", true)}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-lg text-sm transition-all duration-200",
                      isSeller === true
                        ? "bg-black font-semibold text-white dark:bg-blue-900/30 dark:text-blue-400"
                        : "bg-gray-200 text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500",
                    )}
                  >
                    사업자
                  </button>
                </div>
                {errors.isSeller && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <span className="h-1 w-1 rounded-full bg-red-500"></span>
                    {errors.isSeller.message}
                  </div>
                )}
              </div>

              {/* 닉네임 규칙 안내 */}
              <div className="space-y-2 rounded-lg bg-gray-50 p-2 dark:bg-gray-700/50">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  닉네임/업체명 규칙
                </h4>
                <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                  <li>
                    • {NICKNAME_MIN_LENGTH}~{NICKNAME_MAX_LENGTH}자 사이로 입력해주세요
                  </li>
                  <li>• 한글, 영문, 숫자, 특수문자 사용 가능합니다</li>
                  <li>• 숫자로만 구성된 닉네임/업체명은 사용할 수 없습니다</li>
                </ul>
              </div>

              <Button
                type="submit"
                disabled={
                  !isValid ||
                  isRegisterPending ||
                  duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE
                }
                className="h-12 w-full rounded-xl bg-black text-base font-bold transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
              >
                {isRegisterPending ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    처리중...
                  </div>
                ) : (
                  "회원정보 설정 완료"
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* 추가 안내 */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            문제가 있으시면 고객센터로 문의해주세요
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
