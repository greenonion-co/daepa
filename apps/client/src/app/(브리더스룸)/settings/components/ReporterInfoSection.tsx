"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  userControllerGetUserPrivateInfo,
  userControllerGetUserProfile,
  userControllerUpdateUserPrivateInfo,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";
import { SettingsGroup } from "./SettingsGroup";
import AddressSearch from "@/components/common/AddressSearch";
import { SettingsItem } from "./SettingsItem";

type PublicField = "isRealNamePublic" | "isPhonePublic" | "isAddressPublic";

const PublicToggle = ({
  checked,
  field,
  disabled,
  onToggle,
  tooltipText,
}: {
  checked: boolean;
  field: PublicField;
  disabled: boolean;
  onToggle: (field: PublicField, value: boolean) => void;
  tooltipText?: string;
}) => (
  <div
    className="flex items-center py-4"
    onClick={(e) => {
      e.stopPropagation();
      if (!disabled) onToggle(field, !checked);
    }}
  >
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center">
          <Switch checked={checked} disabled={disabled} />
        </span>
      </TooltipTrigger>
      {disabled && tooltipText && <TooltipContent>{tooltipText}</TooltipContent>}
    </Tooltip>
  </div>
);

const ReporterInfoSection = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
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

  const { data: privateInfo, refetch } = useQuery({
    queryKey: [userControllerGetUserPrivateInfo.name],
    queryFn: userControllerGetUserPrivateInfo,
    select: (response) => response.data.data,
  });

  const { mutateAsync: updatePrivateInfo, isPending } = useMutation({
    mutationFn: userControllerUpdateUserPrivateInfo,
  });

  const handleStartEdit = () => {
    const phoneParts = privateInfo?.phone?.split("-")?.map((s) => s.trim());
    setForm({
      realName: privateInfo?.realName ?? "",
      phone1: phoneParts?.[0] ?? "",
      phone2: phoneParts?.[1] ?? "",
      phone3: phoneParts?.[2] ?? "",
      address: privateInfo?.address ?? "",
    });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setForm({ realName: "", phone1: "", phone2: "", phone3: "", address: "" });
  };

  const handleSave = async () => {
    const { phone1, phone2, phone3 } = form;
    const hasAnyPhone = phone1 || phone2 || phone3;
    if (hasAnyPhone) {
      if (!/^\d{2,3}$/.test(phone1) || !/^\d{3,4}$/.test(phone2) || !/^\d{4}$/.test(phone3)) {
        toast.error("연락처를 올바른 형식으로 입력해주세요.");
        return;
      }
    }

    const newPhone = hasAnyPhone ? `${phone1}-${phone2}-${phone3}` : null;
    const currentRealName = privateInfo?.realName ?? "";
    const currentPhone = privateInfo?.phone ?? "";
    const currentAddress = privateInfo?.address ?? "";

    if (
      form.realName === currentRealName &&
      (newPhone ?? "") === currentPhone &&
      form.address === currentAddress
    ) {
      setIsEditing(false);
      return;
    }

    try {
      await updatePrivateInfo({
        realName: (form.realName || null) as never,
        phone: newPhone as never,
        address: (form.address || null) as never,
      });
      await refetch();
      toast.success("신고자 정보가 저장되었습니다.");
      setIsEditing(false);
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

  const isBiz = userProfile?.isBiz ?? false;

  const handleTogglePublic = useCallback(
    async (field: PublicField, value: boolean) => {
      try {
        await updatePrivateInfo({ [field]: value });
        await refetch();
        const label = {
          isRealNamePublic: "성명",
          isPhonePublic: "연락처",
          isAddressPublic: "주소",
        }[field];
        toast.success(`${label} 정보가 ${value ? "공개" : "비공개"}로 변경되었습니다.`);
      } catch {
        toast.error("공개 설정 변경에 실패했습니다.");
      }
    },
    [updatePrivateInfo, refetch],
  );

  return (
    <SettingsGroup title="실명 정보" subTitle="*비공개 정보는 신고서 작성 시에만 사용됩니다.">
      {isEditing ? (
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">
              성명(상호)
            </label>
            <input
              type="text"
              className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="실명을 입력하세요"
              value={form.realName}
              onChange={(e) => setForm((prev) => ({ ...prev, realName: e.target.value }))}
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
                placeholder="00"
                maxLength={3}
                value={form.phone1}
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setForm((prev) => ({ ...prev, phone1: v }));
                }}
              />
              <span className="text-gray-400">-</span>
              <input
                type="tel"
                className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-center text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                placeholder="0000"
                maxLength={4}
                value={form.phone2}
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setForm((prev) => ({ ...prev, phone2: v }));
                }}
              />
              <span className="text-gray-400">-</span>
              <input
                type="tel"
                className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-center text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
                placeholder="0000"
                maxLength={4}
                value={form.phone3}
                inputMode="numeric"
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setForm((prev) => ({ ...prev, phone3: v }));
                }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">주소</label>
            <AddressSearch
              value={form.address}
              onChange={(address) => setForm((prev) => ({ ...prev, address }))}
              placeholder="주소를 검색하세요"
              className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="lg"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              className="flex-1 rounded-xl"
            >
              취소
            </Button>
            <Button
              size="lg"
              onClick={handleSave}
              disabled={isPending}
              className="flex-1 rounded-xl"
            >
              {isPending ? "저장중..." : "저장"}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <SettingsItem
            icon={
              <PublicToggle
                checked={privateInfo?.isRealNamePublic ?? false}
                field="isRealNamePublic"
                disabled={!isBiz}
                onToggle={handleTogglePublic}
                tooltipText="개인 회원의 정보 공개는 준비중입니다"
              />
            }
            label="성명(상호)"
            value={String(privateInfo?.realName ?? "미설정")}
            onClick={handleStartEdit}
            showChevron
          />
          <SettingsItem
            icon={
              <PublicToggle
                checked={privateInfo?.isPhonePublic ?? false}
                field="isPhonePublic"
                disabled={!isBiz}
                onToggle={handleTogglePublic}
                tooltipText="개인 회원의 정보 공개는 준비중입니다"
              />
            }
            label="연락처"
            value={String(privateInfo?.phone ?? "미설정")}
            onClick={handleStartEdit}
            showChevron
          />
          <SettingsItem
            icon={
              <PublicToggle
                checked={privateInfo?.isAddressPublic ?? false}
                field="isAddressPublic"
                disabled={!isBiz}
                onToggle={handleTogglePublic}
                tooltipText="개인 회원의 정보 공개는 준비중입니다"
              />
            }
            label="주소"
            value={String(privateInfo?.address ?? "미설정")}
            onClick={handleStartEdit}
            showChevron
          />
        </>
      )}
    </SettingsGroup>
  );
};

export default ReporterInfoSection;
