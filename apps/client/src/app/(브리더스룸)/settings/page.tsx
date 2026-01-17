"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Edit2, LogOut, Trash2, HelpCircle, FileText, Shield, Mail } from "lucide-react";
import DeleteAccountButton from "./components/DeleteAccountButton";
import { SettingsGroup, SettingsItem } from "./components";
import NicknameDuplicateCheckInput from "./components/NicknameDuplicateCheckInput";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userControllerGetUserProfile, userControllerCreateInitUserInfo } from "@repo/api-client";
import { toast } from "@/lib/toast";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AxiosError } from "axios";
import { providerIconMap } from "../../(user)/constants";
import { DUPLICATE_CHECK_STATUS } from "../constants";
import { useLogout } from "@/hooks/useLogout";

const SettingsPage = () => {
  const queryClient = useQueryClient();
  const { logout } = useLogout();
  const { theme, setTheme } = useTheme();

  // 닉네임 수정 관련 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<
    (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS]
  >(DUPLICATE_CHECK_STATUS.NONE);

  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: (response) => response.data.data,
  });

  const { mutateAsync: updateNickname, isPending: isUpdatingNickname } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
  });

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };

  const normalizedProviders = Array.isArray(userProfile?.provider)
    ? userProfile?.provider
    : userProfile?.provider
      ? [userProfile.provider]
      : [];

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

  // 닉네임 저장
  const handleSaveNickname = async () => {
    if (duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE) {
      toast.error("중복확인을 먼저 진행해주세요.");
      return;
    }

    try {
      await updateNickname({ name: newNickname });

      queryClient.invalidateQueries({ queryKey: [userControllerGetUserProfile.name] });
      toast.success("닉네임이 성공적으로 변경되었습니다.");
      setIsEditingNickname(false);
      setNewNickname("");
      setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorMessage = Array.isArray(message) ? message[0] : message;
        toast.error(errorMessage || "닉네임 변경 중 오류가 발생했습니다.");
      } else {
        toast.error("닉네임 변경 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen dark:bg-neutral-900">
      <div>
        {/* 프로필 섹션 */}
        <SettingsGroup className="px-2">
          <div className="flex items-center gap-4 bg-neutral-100 p-2 px-4 dark:bg-neutral-700">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <Image src="/assets/lizard.png" alt="조회된 펫 없음" fill />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                  {userProfile?.name ?? "사용자"}
                </h2>
                <Badge
                  className={cn(
                    "text-[11px] font-[600]",
                    userProfile?.isBiz
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-blue-600 hover:bg-blue-700",
                  )}
                >
                  {userProfile?.isBiz ? "사업자" : "일반"}
                </Badge>
              </div>
              <p className="text-[13px] text-gray-500 dark:text-gray-400">
                {userProfile?.email ?? ""}
              </p>
            </div>
          </div>
        </SettingsGroup>

        {/* 계정 정보 */}
        <SettingsGroup title="계정 정보">
          {isEditingNickname ? (
            <div className="space-y-3 p-4">
              <NicknameDuplicateCheckInput
                value={newNickname}
                onChange={setNewNickname}
                duplicateCheckStatus={duplicateCheckStatus}
                setDuplicateCheckStatus={setDuplicateCheckStatus}
                currentNickname={userProfile?.name}
              />
              <div className="flex gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={handleCancelEditNickname}
                  disabled={isUpdatingNickname}
                  className="flex-1 rounded-xl"
                >
                  취소
                </Button>
                <Button
                  size="lg"
                  onClick={handleSaveNickname}
                  disabled={
                    isUpdatingNickname || duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE
                  }
                  className="flex-1 rounded-xl"
                >
                  {isUpdatingNickname ? "저장중..." : "저장"}
                </Button>
              </div>
            </div>
          ) : (
            <SettingsItem
              icon={<Edit2 className="h-4 w-4" />}
              iconBgColor="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
              label="닉네임"
              value={userProfile?.name ?? "설정되지 않음"}
              onClick={handleStartEditNickname}
              showChevron
            />
          )}
          <SettingsItem
            icon={<Mail className="h-4 w-4" />}
            iconBgColor="bg-gray-100 dark:bg-neutral-700"
            iconColor="text-gray-600 dark:text-gray-400"
            label="이메일"
            value={
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-[600] text-gray-700 dark:text-gray-400">
                  {userProfile?.email ?? ""}
                </span>
                {normalizedProviders.map((provider) => (
                  <Image
                    key={provider}
                    src={providerIconMap[provider]}
                    alt={provider}
                    width={18}
                    height={18}
                  />
                ))}
              </div>
            }
          />
          <SettingsItem
            icon={<Shield className="h-4 w-4" />}
            iconBgColor="bg-green-100 dark:bg-green-900/30"
            iconColor="text-green-600 dark:text-green-400"
            label="계정 상태"
            rightElement={
              <Badge variant="secondary" className="text-[12px]">
                정상
              </Badge>
            }
          />
        </SettingsGroup>

        {/* 앱 설정 */}
        <SettingsGroup title="앱 설정">
          <SettingsItem
            icon={theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            iconBgColor={theme === "dark" ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-yellow-100"}
            iconColor={
              theme === "dark" ? "text-indigo-600 dark:text-indigo-400" : "text-yellow-600"
            }
            label="다크 모드"
            rightElement={<Switch checked={theme === "dark"} onCheckedChange={handleThemeChange} />}
          />
        </SettingsGroup>

        {/* 도움말 및 지원 */}
        <SettingsGroup title="도움말">
          <SettingsItem
            icon={<HelpCircle className="h-4 w-4" />}
            iconBgColor="bg-purple-100 dark:bg-purple-900/30"
            iconColor="text-purple-600 dark:text-purple-400"
            label="자주 묻는 질문"
            showChevron
            onClick={() => {}}
          />
          <SettingsItem
            icon={<Mail className="h-4 w-4" />}
            iconBgColor="bg-teal-100 dark:bg-teal-900/30"
            iconColor="text-teal-600 dark:text-teal-400"
            label="고객센터 문의"
            showChevron
            onClick={() => {}}
          />
          <SettingsItem
            icon={<FileText className="h-4 w-4" />}
            iconBgColor="bg-gray-100 dark:bg-neutral-700"
            iconColor="text-gray-600 dark:text-gray-400"
            label="이용약관"
            showChevron
            onClick={() => {}}
          />
          <SettingsItem
            icon={<Shield className="h-4 w-4" />}
            iconBgColor="bg-gray-100 dark:bg-neutral-700"
            iconColor="text-gray-600 dark:text-gray-400"
            label="개인정보처리방침"
            showChevron
            onClick={() => {}}
          />
        </SettingsGroup>

        {/* 계정 관리 (위험 영역) */}
        <SettingsGroup title="계정 관리">
          <SettingsItem
            icon={<LogOut className="h-4 w-4" />}
            iconBgColor="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            label="로그아웃"
            isDestructive
            onClick={logout}
          />
          <SettingsItem
            icon={<Trash2 className="h-4 w-4" />}
            iconBgColor="bg-red-100 dark:bg-red-900/30"
            iconColor="text-red-600 dark:text-red-400"
            label="회원탈퇴"
            isDestructive
            rightElement={<DeleteAccountButton />}
          />
        </SettingsGroup>

        {/* 버전 정보 */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">버전 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
