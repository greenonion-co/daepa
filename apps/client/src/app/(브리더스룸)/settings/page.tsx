"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Moon,
  Sun,
  Edit2,
  LogOut,
  Trash2,
  HelpCircle,
  FileText,
  Shield,
  Mail,
  Smartphone,
  User,
  Phone,
  MapPin,
} from "lucide-react";
import type { Theme } from "@/types/theme";
import DeleteAccountButton from "./components/DeleteAccountButton";
import { SettingsGroup, SettingsItem } from "./components";
import NicknameDuplicateCheckInput from "./components/NicknameDuplicateCheckInput";
import { useTheme } from "@/contexts/ThemeContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  userControllerGetUserProfile,
  userControllerCreateInitUserInfo,
  userControllerGetUserPrivateInfo,
  userControllerUpdateUserPrivateInfo,
} from "@repo/api-client";
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
  const { theme, resolvedTheme, setTheme } = useTheme();

  // 닉네임 수정 관련 상태
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<
    (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS]
  >(DUPLICATE_CHECK_STATUS.NONE);

  // 신고자 정보 수정 관련 상태
  const [isEditingPrivateInfo, setIsEditingPrivateInfo] = useState(false);
  const [privateInfoForm, setPrivateInfoForm] = useState({
    realName: "",
    phone1: "",
    phone2: "",
    phone3: "",
    address: "",
  });

  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: (response) => response.data.data,
  });

  const { mutateAsync: updateNickname, isPending: isUpdatingNickname } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
  });

  const { data: privateInfo } = useQuery({
    queryKey: [userControllerGetUserPrivateInfo.name],
    queryFn: userControllerGetUserPrivateInfo,
    select: (response) => response.data.data,
  });

  const { mutateAsync: updatePrivateInfo, isPending: isUpdatingPrivateInfo } = useMutation({
    mutationFn: userControllerUpdateUserPrivateInfo,
  });

  const themeOptions: Array<{ key: Theme; label: string; icon: React.ReactNode }> = [
    { key: "light", label: "라이트", icon: <Sun className="h-4 w-4" /> },
    { key: "dark", label: "다크", icon: <Moon className="h-4 w-4" /> },
    { key: "system", label: "시스템", icon: <Smartphone className="h-4 w-4" /> },
  ];

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

  // 신고자 정보 수정 시작
  const handleStartEditPrivateInfo = () => {
    const phoneParts = (privateInfo?.phone as string | undefined)?.split("-").map((s) => s.trim());
    setPrivateInfoForm({
      realName: (privateInfo?.realName as string | undefined) ?? "",
      phone1: phoneParts?.[0] ?? "",
      phone2: phoneParts?.[1] ?? "",
      phone3: phoneParts?.[2] ?? "",
      address: (privateInfo?.address as string | undefined) ?? "",
    });
    setIsEditingPrivateInfo(true);
  };

  // 신고자 정보 수정 취소
  const handleCancelEditPrivateInfo = () => {
    setIsEditingPrivateInfo(false);
    setPrivateInfoForm({ realName: "", phone1: "", phone2: "", phone3: "", address: "" });
  };

  // 신고자 정보 저장
  const handleSavePrivateInfo = async () => {
    const { phone1, phone2, phone3 } = privateInfoForm;
    const hasAnyPhone = phone1 || phone2 || phone3;
    if (hasAnyPhone) {
      if (!/^\d{2,3}$/.test(phone1) || !/^\d{3,4}$/.test(phone2) || !/^\d{4}$/.test(phone3)) {
        toast.error("연락처를 올바른 형식으로 입력해주세요.");
        return;
      }
    }

    try {
      const phone = hasAnyPhone ? `${phone1}-${phone2}-${phone3}` : null;
      await updatePrivateInfo({
        realName: (privateInfoForm.realName || null) as never,
        phone: phone as never,
        address: (privateInfoForm.address || null) as never,
      });
      queryClient.invalidateQueries({ queryKey: [userControllerGetUserPrivateInfo.name] });
      toast.success("신고자 정보가 저장되었습니다.");
      setIsEditingPrivateInfo(false);
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        const message = error.response?.data?.message;
        const errorMessage = Array.isArray(message) ? message[0] : message;
        toast.error(errorMessage || "신고자 정보 저장 중 오류가 발생했습니다.");
      } else {
        toast.error("신고자 정보 저장 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="min-h-screen">
      <div>
        {/* 프로필 섹션 */}
        <SettingsGroup className="px-2">
          <div className="flex items-center gap-4 bg-neutral-100 p-2 px-4 dark:bg-[#18171C]">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <Image src="/assets/lizard.png" alt="조회된 펫 없음" fill />
            </div>
            {userProfile?.userId && (
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
            )}
          </div>
        </SettingsGroup>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4">
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
                      isUpdatingNickname ||
                      duplicateCheckStatus !== DUPLICATE_CHECK_STATUS.AVAILABLE
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
              label="계정 연동"
              value={
                <div className="flex items-center gap-2">
                  {normalizedProviders.map((provider) => (
                    <Image
                      key={provider}
                      src={providerIconMap[provider]}
                      alt={provider}
                      width={18}
                      height={18}
                      className={cn(provider === "apple" && "dark:invert")}
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

          {/* 신고자 정보 */}
          <SettingsGroup title="신고자 정보">
            {isEditingPrivateInfo ? (
              <div className="space-y-3 p-4">
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                    이름
                  </label>
                  <input
                    type="text"
                    className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    placeholder="실명을 입력하세요"
                    value={privateInfoForm.realName}
                    onChange={(e) =>
                      setPrivateInfoForm((prev) => ({ ...prev, realName: e.target.value }))
                    }
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                    연락처
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="tel"
                      className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-center text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      placeholder="010"
                      maxLength={3}
                      value={privateInfoForm.phone1}
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setPrivateInfoForm((prev) => ({ ...prev, phone1: v }));
                      }}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="tel"
                      className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-center text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      placeholder="0000"
                      maxLength={4}
                      value={privateInfoForm.phone2}
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setPrivateInfoForm((prev) => ({ ...prev, phone2: v }));
                      }}
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="tel"
                      className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-center text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                      placeholder="0000"
                      maxLength={4}
                      value={privateInfoForm.phone3}
                      inputMode="numeric"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "");
                        setPrivateInfoForm((prev) => ({ ...prev, phone3: v }));
                      }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
                    주소
                  </label>
                  <input
                    type="text"
                    className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                    placeholder="주소를 입력하세요"
                    value={privateInfoForm.address}
                    onChange={(e) =>
                      setPrivateInfoForm((prev) => ({ ...prev, address: e.target.value }))
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleCancelEditPrivateInfo}
                    disabled={isUpdatingPrivateInfo}
                    className="flex-1 rounded-xl"
                  >
                    취소
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleSavePrivateInfo}
                    disabled={isUpdatingPrivateInfo}
                    className="flex-1 rounded-xl"
                  >
                    {isUpdatingPrivateInfo ? "저장중..." : "저장"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SettingsItem
                  icon={<User className="h-4 w-4" />}
                  iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                  iconColor="text-orange-600 dark:text-orange-400"
                  label="이름"
                  value={String(privateInfo?.realName ?? "미설정")}
                  onClick={handleStartEditPrivateInfo}
                  showChevron
                />
                <SettingsItem
                  icon={<Phone className="h-4 w-4" />}
                  iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                  iconColor="text-orange-600 dark:text-orange-400"
                  label="연락처"
                  value={String(privateInfo?.phone ?? "미설정")}
                  onClick={handleStartEditPrivateInfo}
                  showChevron
                />
                <SettingsItem
                  icon={<MapPin className="h-4 w-4" />}
                  iconBgColor="bg-orange-100 dark:bg-orange-900/30"
                  iconColor="text-orange-600 dark:text-orange-400"
                  label="주소"
                  value={String(privateInfo?.address ?? "미설정")}
                  onClick={handleStartEditPrivateInfo}
                  showChevron
                />
              </>
            )}
          </SettingsGroup>

          {/* 앱 설정 */}
          {/*<SettingsGroup title="앱 설정">*/}
          {/*  <SettingsItem*/}
          {/*    icon={*/}
          {/*      resolvedTheme === "dark" ? (*/}
          {/*        <Moon className="h-4 w-4" />*/}
          {/*      ) : (*/}
          {/*        <Sun className="h-4 w-4" />*/}
          {/*      )*/}
          {/*    }*/}
          {/*    iconBgColor={*/}
          {/*      resolvedTheme === "dark" ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-yellow-100"*/}
          {/*    }*/}
          {/*    iconColor={*/}
          {/*      resolvedTheme === "dark"*/}
          {/*        ? "text-indigo-600 dark:text-indigo-400"*/}
          {/*        : "text-yellow-600"*/}
          {/*    }*/}
          {/*    label="테마"*/}
          {/*    rightElement={*/}
          {/*      <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-neutral-700">*/}
          {/*        {themeOptions.map((option) => (*/}
          {/*          <button*/}
          {/*            key={option.key}*/}
          {/*            onClick={() => setTheme(option.key)}*/}
          {/*            className={cn(*/}
          {/*              "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",*/}
          {/*              theme === option.key*/}
          {/*                ? "bg-white text-gray-900 shadow-sm dark:bg-neutral-600 dark:text-white"*/}
          {/*                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",*/}
          {/*            )}*/}
          {/*          >*/}
          {/*            {option.icon}*/}
          {/*            <span className="hidden sm:inline">{option.label}</span>*/}
          {/*          </button>*/}
          {/*        ))}*/}
          {/*      </div>*/}
          {/*    }*/}
          {/*  />*/}
          {/*</SettingsGroup>*/}

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
        </div>

        {/* 버전 정보 */}
        <div className="mt-8 text-center">
          <p className="text-[13px] text-gray-400 dark:text-gray-500">버전 1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
