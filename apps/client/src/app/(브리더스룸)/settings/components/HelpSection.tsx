"use client";

import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";
import { useAppRouter } from "@/hooks/useAppRouter";

const HelpSection = () => {
  const router = useAppRouter();

  return (
    <SettingsGroup title="고객지원">
      {/* TODO: 자주 묻는 질문 기능 제공 시 노출
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="자주 묻는 질문"
        showChevron
        disabled
      />
      */}
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="1:1 문의하기"
        showChevron
        onClick={() => router.push("/inquiry")}
      />
      {/* TODO: 이용약관 기능 제공 시 노출
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="이용약관"
        showChevron
        disabled
      />
      */}
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="개인정보처리방침"
        showChevron
        onClick={() => router.push("/privacy")}
      />
    </SettingsGroup>
  );
};

export default HelpSection;