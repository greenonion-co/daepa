"use client";

import { useAppRouter } from "@/hooks/useAppRouter";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const HelpSection = () => {
  const router = useAppRouter();

  return (
    <SettingsGroup title="도움말">
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="자주 묻는 질문"
        showChevron
        onClick={() => router.push("/help")}
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="고객센터 문의"
        showChevron
        onClick={() => router.push("/help#contact")}
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="이용약관"
        showChevron
        onClick={() => router.push("/terms")}
      />
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
