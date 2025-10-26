"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Info, User } from "lucide-react";
import { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useMutation } from "@tanstack/react-query";
import { userControllerCreateInitUserInfo, userControllerVerifyName } from "@repo/api-client";
import { AxiosError } from "axios";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/register/types";

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
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<DUPLICATE_CHECK_STATUS>(
    DUPLICATE_CHECK_STATUS.NONE,
  );

  const { mutateAsync: mutateRegister, isPending: isRegisterPending } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
  });

  const { mutateAsync: mutateVerifyName, isPending: isVerifyPending } = useMutation({
    mutationFn: userControllerVerifyName,
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

  // 닉네임이 변경되면 중복확인 상태 초기화
  useEffect(() => {
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  }, [nickname]);

  // 중복확인 함수
  const handleDuplicateCheck = async () => {
    if (!nickname || errors.nickname) {
      toast.error("올바른 닉네임을 입력해주세요.");
      return;
    }

    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.CHECKING);

    try {
      const response = await mutateVerifyName({ name: nickname });

      if (response.data.success) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.AVAILABLE);
        toast.success("사용 가능한 닉네임입니다.");
      }
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 409) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.DUPLICATE);
        toast.error("이미 사용중인 닉네임입니다.");
      } else {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
        toast.error("중복확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

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
    } catch (error) {
      console.error("회원정보 등록 실패:", error);
      toast.error("회원정보 등록에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 중복확인 버튼 비활성화 조건
  const isDuplicateCheckDisabled = !nickname || !!errors.nickname || isVerifyPending;

  return (
    <div className="m-2 flex min-h-screen w-full items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-md">
        {/* 메인 카드 */}
        <Card className="rounded-3xl border-gray-100 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-gray-800/80">
          <CardHeader className="pb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <User className="h-8 w-8 text-blue-400 dark:text-blue-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              회원정보 설정
            </CardTitle>
            <CardDescription className="text-gray-600 dark:text-gray-400">
              서비스 이용을 위해 필요한 정보를 설정해주세요
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* 닉네임 입력 */}
              <div className="space-y-2">
                <label
                  htmlFor="nickname"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  닉네임/업체명
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="닉네임/업체명을 입력해주세요"
                      className={cn("h-12 pr-16")}
                      maxLength={NICKNAME_MAX_LENGTH}
                      {...register("nickname")}
                      onChange={(e) => {
                        if (e.target.value.length > NICKNAME_MAX_LENGTH) {
                          e.target.value = e.target.value.slice(0, NICKNAME_MAX_LENGTH);
                        }
                        register("nickname").onChange(e);
                      }}
                    />
                    {nickname && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                        {nickname.length}/{NICKNAME_MAX_LENGTH}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    onClick={handleDuplicateCheck}
                    disabled={isDuplicateCheckDisabled}
                    className="h-12 bg-blue-600 px-4 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
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
                </div>

                {errors.nickname && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <Info className="h-4 w-4" />
                    {errors.nickname.message}
                  </div>
                )}

                {/* 중복확인 결과 표시 */}
                {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.AVAILABLE && (
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    사용 가능한 닉네임/업체명입니다
                  </div>
                )}

                {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.DUPLICATE && (
                  <div className="flex items-center gap-1 text-sm text-red-500">
                    <Info className="h-4 w-4" />
                    이미 사용중인 닉네임/업체명입니다
                  </div>
                )}

                {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.CHECKING && (
                  <div className="flex items-center gap-1 text-sm text-blue-500">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                    중복확인 중...
                  </div>
                )}
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
                      "flex h-12 items-center justify-center rounded-lg border-[1.4px] text-sm transition-all duration-200",
                      isSeller === false
                        ? "border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500",
                    )}
                  >
                    일반 사용자
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("isSeller", true)}
                    className={cn(
                      "flex h-12 items-center justify-center rounded-lg border-[1.4px] text-sm transition-all duration-200",
                      isSeller === true
                        ? "border-blue-500 bg-blue-50 font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:border-gray-500",
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
              <div className="space-y-2 rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
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
                className="h-12 w-full rounded-xl bg-blue-600 text-base font-bold transition-all duration-200 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500"
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
          </CardContent>
        </Card>

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
