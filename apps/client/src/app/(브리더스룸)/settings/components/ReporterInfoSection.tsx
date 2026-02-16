"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Phone, MapPin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  userControllerGetUserPrivateInfo,
  userControllerUpdateUserPrivateInfo,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const ReporterInfoSection = () => {
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    realName: "",
    phone1: "",
    phone2: "",
    phone3: "",
    address: "",
  });

  const { data: privateInfo } = useQuery({
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
      queryClient.invalidateQueries({ queryKey: [userControllerGetUserPrivateInfo.name] });
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

  return (
    <SettingsGroup title="신고자 정보">
      {isEditing ? (
        <div className="space-y-3 p-4">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-gray-600 dark:text-gray-400">이름</label>
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
                placeholder="010"
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
            <input
              type="text"
              className="h-[40px] w-full rounded-xl border border-gray-200 p-3 text-[16px] placeholder:font-[500] dark:border-neutral-600 dark:bg-neutral-700 dark:text-white"
              placeholder="주소를 입력하세요"
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
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
            icon={<User className="h-4 w-4" />}
            iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            label="이름"
            value={String(privateInfo?.realName ?? "미설정")}
            onClick={handleStartEdit}
            showChevron
          />
          <SettingsItem
            icon={<Phone className="h-4 w-4" />}
            iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
            label="연락처"
            value={String(privateInfo?.phone ?? "미설정")}
            onClick={handleStartEdit}
            showChevron
          />
          <SettingsItem
            icon={<MapPin className="h-4 w-4" />}
            iconBgColor="bg-orange-100 dark:bg-orange-900/30"
            iconColor="text-orange-600 dark:text-orange-400"
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
