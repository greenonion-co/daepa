"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userControllerGetUserProfile, userControllerCreateInitUserInfo } from "@repo/api-client";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";
import NicknameDuplicateCheckInput from "./NicknameDuplicateCheckInput";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";
import { providerIconMap } from "@/app/(user)/constants";

const AccountInfoSection = () => {
  const queryClient = useQueryClient();

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [duplicateCheckStatus, setDuplicateCheckStatus] = useState<
    (typeof DUPLICATE_CHECK_STATUS)[keyof typeof DUPLICATE_CHECK_STATUS]
  >(DUPLICATE_CHECK_STATUS.NONE);

  const { data: userProfile, isFetching } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: (response) => response.data.data,
  });

  const { mutateAsync: updateNickname, isPending: isUpdatingNickname } = useMutation({
    mutationFn: userControllerCreateInitUserInfo,
  });

  const normalizedProviders = Array.isArray(userProfile?.provider)
    ? userProfile?.provider
    : userProfile?.provider
      ? [userProfile.provider]
      : [];

  const handleStartEditNickname = () => {
    setNewNickname(userProfile?.name ?? "");
    setIsEditingNickname(true);
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

  const handleCancelEditNickname = () => {
    setIsEditingNickname(false);
    setNewNickname("");
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
  };

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
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
          label="닉네임"
          value={userProfile?.name ?? "설정되지 않음"}
          onClick={handleStartEditNickname}
          showChevron
        />
      )}
      <SettingsItem
        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
        label="계정 연동"
        value={
          <div className="flex items-center gap-2">
            {normalizedProviders.map((provider) => (
              <Image
                key={provider}
                src={providerIconMap[provider]}
                alt={provider}
                width={22}
                height={22}
                className={cn(provider === "apple" && "dark:invert")}
              />
            ))}
          </div>
        }
      />
      <SettingsItem
        iconBgColor="bg-blue-100 dark:bg-blue-900/30"
        iconColor="text-blue-600 dark:text-blue-400"
        label="회원 유형"
        rightElement={
          !isFetching &&
          (userProfile?.isBiz ? (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-[#DBEDDB] px-2 py-0.5 text-[11px] leading-none font-medium text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]">
                사업자
              </span>
              <button
                type="button"
                className="inline-flex items-center rounded-full border border-amber-300 px-2 py-0.5 text-[11px] leading-none font-medium text-amber-600 dark:border-amber-600 dark:text-amber-400"
                onClick={() => toast.info("사업자 인증 기능은 준비 중입니다.")}
              >
                미인증
              </button>
            </div>
          ) : (
            <span className="inline-flex items-center rounded-full bg-[#D3E5EF] px-2 py-0.5 text-[11px] leading-none font-medium text-[#28638D] dark:bg-[#1E3A5F] dark:text-[#A3C9E8]">
              개인
            </span>
          ))
        }
      />
    </SettingsGroup>
  );
};

export default AccountInfoSection;
