"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Trash2,
  Settings,
  ChevronRight,
  Edit2,
  Info,
  CircleX,
  CircleCheck,
} from "lucide-react";
import DeleteAccountButton from "./components/DeleteAccountButton";
import { Switch } from "@/components/ui/switch";
import { useRouter } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authControllerSignOut,
  userControllerGetUserProfile,
  userControllerCreateInitUserInfo,
  userControllerVerifyName,
  CommonResponseDto,
} from "@repo/api-client";
import { toast } from "sonner";
import Image from "next/image";
import { USER_STATUS_MAP } from "@/app/(브리더스룸)/constants";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";

const NICKNAME_MAX_LENGTH = 15;
const NICKNAME_MIN_LENGTH = 2;

// 중복확인 상태 타입
enum DUPLICATE_CHECK_STATUS {
  NONE = "none",
  CHECKING = "checking",
  AVAILABLE = "available",
  DUPLICATE = "duplicate",
}

const SettingsPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
  });

  // 닉네임 수정 관련 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<DUPLICATE_CHECK_STATUS>(
    DUPLICATE_CHECK_STATUS.NONE,
  );

  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: (response) => response.data.data,
  });

  const { mutate: signOut } = useMutation({
    mutationFn: authControllerSignOut,
    onSuccess: () => {
      localStorage.removeItem("accessToken");
      toast.success("로그아웃 되었습니다.");
      router.replace("/pet");
    },
  });

  const { mutateAsync: updateNickname, isPending: isUpdatingNickname } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [userControllerGetUserProfile.name] });
      toast.success("닉네임이 성공적으로 변경되었습니다.");
      setIsEditingNickname(false);
      setNewNickname("");
      setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
    },
    onError: (error: AxiosError<CommonResponseDto>) => {
      if (error?.response?.status === 409) {
        toast.error("이미 사용중인 닉네임입니다.");
      } else {
        toast.error("닉네임 변경 중 오류가 발생했습니다.");
      }
    },
  });

  const { mutateAsync: verifyName, isPending: isVerifyingName } = useMutation({
    mutationFn: userControllerVerifyName,
  });

  const toggleNotification = (type: keyof typeof notifications) => {
    setNotifications((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };

  // 닉네임 수정 시작
  const handleStartEditNickname = () => {
    setNewNickname(userProfile?.name ?? "");
    setIsEditingNickname(true);
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

  // 닉네임 수정 취소
  const handleCancelEditNickname = () => {
    setIsEditingNickname(false);
    setNewNickname("");
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

  // 중복확인 함수
  const handleDuplicateCheck = async () => {
    if (
      !newNickname ||
      newNickname.length < NICKNAME_MIN_LENGTH ||
      newNickname.length > NICKNAME_MAX_LENGTH
    ) {
      toast.error("올바른 닉네임을 입력해주세요.");
      return;
    }

    if (newNickname === userProfile?.name) {
      toast.error("현재 닉네임과 동일합니다.");
      return;
    }

    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.CHECKING);

    try {
      const response = await verifyName({ name: newNickname });

      if (response.data.success) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.AVAILABLE);
        toast.success("사용 가능한 닉네임입니다.");
      }
    } catch (error) {
      const axiosError = error as AxiosError<CommonResponseDto>;
      if (axiosError?.response?.status === 409) {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.DUPLICATE);
        toast.error("이미 사용중인 닉네임입니다.");
      } else {
        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
        toast.error("중복확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      }
    }
  };

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (
      !newNickname ||
      newNickname.length < NICKNAME_MIN_LENGTH ||
      newNickname.length > NICKNAME_MAX_LENGTH
    ) {
      toast.error("닉네임은 2자 이상 15자 이하여야 합니다.");
      return;
    }

    if (newNickname === userProfile?.name) {
      toast.error("현재 닉네임과 동일합니다.");
      return;
    }

    if (duplicateCheckStatus !== "available" && newNickname !== userProfile?.name) {
      toast.error("중복확인을 먼저 진행해주세요.");
      return;
    }

    await updateNickname({ name: newNickname });
  };

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* 헤더 */}
      <div className="mb-8 flex items-center gap-3">
        <Settings className="h-8 w-8" />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">설정</h1>
            <Badge
              className={cn(
                userProfile?.isBiz
                  ? "bg-green-700 hover:bg-green-800"
                  : "bg-blue-700 hover:bg-blue-800",
                "text-white",
              )}
            >
              {userProfile?.isBiz ? "사업자" : "일반 사용자"}
            </Badge>
          </div>
          <p className="text-gray-600 dark:text-gray-400">계정 및 앱 설정을 관리하세요</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 계정 정보 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              계정 정보
            </CardTitle>
            <CardDescription>기본적인 계정 정보를 확인하고 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              {isEditingNickname ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="nickname"
                      placeholder="닉네임을 입력하세요"
                      value={newNickname}
                      onChange={(e) => {
                        setNewNickname(e.target.value);
                        setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
                      }}
                      maxLength={NICKNAME_MAX_LENGTH}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={handleDuplicateCheck}
                      disabled={
                        isVerifyingName || !newNickname || newNickname === userProfile?.name
                      }
                    >
                      {isVerifyingName ? "확인중..." : "중복확인"}
                    </Button>
                  </div>
                  <div className="flex h-5 text-sm">
                    {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.AVAILABLE && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CircleCheck className="h-4 w-4" />
                        사용 가능한 닉네임입니다
                      </div>
                    )}
                    {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.DUPLICATE && (
                      <div className="flex items-center gap-1 text-red-600">
                        <CircleX className="h-4 w-4" />
                        이미 사용중인 닉네임입니다
                      </div>
                    )}
                    {duplicateCheckStatus === DUPLICATE_CHECK_STATUS.NONE && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Info className="h-4 w-4" />
                        닉네임은 {NICKNAME_MIN_LENGTH}자 이상 {NICKNAME_MAX_LENGTH}자 이하여야
                        합니다
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSaveNickname}
                      disabled={isUpdatingNickname || duplicateCheckStatus !== "available"}
                    >
                      {isUpdatingNickname ? "저장중..." : "저장"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelEditNickname}
                      disabled={isUpdatingNickname}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    id="nickname"
                    placeholder="닉네임을 입력하세요"
                    value={userProfile?.name ?? ""}
                    disabled
                    className="flex-1"
                  />
                  <Button size="icon" variant="outline" onClick={handleStartEditNickname}>
                    <Edit2 />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>

              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={userProfile?.email ?? ""}
                  placeholder="이메일을 입력하세요"
                  defaultValue="user@example.com"
                  disabled
                />
                {/* TODO: provider가 여러 개인 경우 대응하기 */}
                <Image
                  src={`/${userProfile?.provider?.[0]}_icon.svg`}
                  alt={userProfile?.provider?.[0] ?? ""}
                  width={24}
                  height={24}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                />
              </div>
              <p className="text-xs text-gray-500">
                SNS 간편 로그인으로 가입한 계정은 이메일 변경이 제한됩니다
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 알림 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              알림 설정
            </CardTitle>
            <CardDescription>원하는 알림 유형을 선택하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">이메일 알림</Label>
                <p className="text-xs text-gray-500">중요한 업데이트 및 보안 알림</p>
              </div>
              <Switch
                checked={notifications.email}
                onCheckedChange={() => toggleNotification("email")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">푸시 알림</Label>
                <p className="text-xs text-gray-500">실시간 알림 및 메시지</p>
              </div>
              <Switch
                checked={notifications.push}
                onCheckedChange={() => toggleNotification("push")}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">마케팅 알림</Label>
                <p className="text-xs text-gray-500">새로운 기능 및 이벤트 정보</p>
              </div>
              <Switch
                checked={notifications.marketing}
                onCheckedChange={() => toggleNotification("marketing")}
              />
            </div>
          </CardContent>
        </Card>

        {/* 개인정보 보호 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              개인정보 보호
            </CardTitle>
            <CardDescription>개인정보 보호 및 보안 설정을 관리하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <Label className="text-sm font-medium">계정 상태</Label>
                <p className="text-xs text-gray-500">
                  {USER_STATUS_MAP[userProfile?.status ?? "pending"]}
                </p>
              </div>
              <Badge variant="secondary">정상</Badge>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <Label className="text-sm font-medium">사업자 여부</Label>
              </div>

              <Badge
                className={cn(userProfile?.isBiz ? "bg-green-700" : "bg-blue-700", "text-white")}
              >
                {userProfile?.isBiz ? "사업자" : "일반 사용자"}
              </Badge>
            </div>
            {/* <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <Label className="text-sm font-medium">마지막 로그인</Label>
                <p className="text-xs text-gray-500">
                  {userProfile?.lastLoginAt
                    ? new Date(userProfile.lastLoginAt).toLocaleString()
                    : "로그인 기록 없음"}
                </p>
              </div>
            </div> */}
            <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
              <div>
                <Label className="text-sm font-medium">가입일</Label>
                <p className="text-xs text-gray-500">
                  {userProfile?.createdAt
                    ? new Date(userProfile.createdAt).toLocaleDateString()
                    : "가입일 정보 없음"}
                </p>
              </div>
            </div>
            {/* <Button variant="outline" className="w-full">
              비밀번호 변경
            </Button> */}
          </CardContent>
        </Card>

        {/* 앱 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />앱 설정
            </CardTitle>
            <CardDescription>앱의 외관과 동작을 커스터마이징하세요</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">
                  다크 모드
                  {theme === "light" ? (
                    <Sun className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                  ) : (
                    <Moon className="h-4 w-4 fill-gray-200 text-gray-200" />
                  )}
                </Label>
                <p className="text-xs text-gray-500">어두운 테마로 전환</p>
              </div>
              <Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 계정 관리 */}
      <Card className="border-red-200 dark:border-red-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Trash2 className="h-5 w-5" />
            계정 관리
          </CardTitle>
          <CardDescription className="text-red-600 dark:text-red-400/70">
            계정 관련 중요한 작업을 수행할 수 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div>
              <Label className="text-sm font-medium text-red-700 dark:text-red-300">로그아웃</Label>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                현재 세션에서 로그아웃합니다
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="border-red-300 text-red-700 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
            >
              로그아웃
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
            <div>
              <Label className="text-sm font-medium text-red-700 dark:text-red-300">회원탈퇴</Label>
              <p className="text-xs text-red-600/70 dark:text-red-400/70">
                계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
              </p>
            </div>
            <DeleteAccountButton />
          </div>
        </CardContent>
      </Card>

      {/* 도움말 및 지원 */}
      <Card>
        <CardHeader>
          <CardTitle>도움말 및 지원</CardTitle>
          <CardDescription>문제가 있으시면 언제든지 문의해주세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="ghost" className="w-full justify-between">
            <span>자주 묻는 질문</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>고객센터 문의</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>이용약관</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" className="w-full justify-between">
            <span>개인정보처리방침</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
