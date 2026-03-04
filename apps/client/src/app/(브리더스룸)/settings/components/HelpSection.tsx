"use client";

import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const HelpSection = () => {
  return (
    <SettingsGroup title="도움말" subTitle="(준비 중)">
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="자주 묻는 질문"
        showChevron
        disabled
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="고객센터 문의"
        showChevron
        disabled
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="이용약관"
        showChevron
        disabled
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="개인정보처리방침"
        showChevron
        disabled
      />
    </SettingsGroup>
  );
};

export default HelpSection;
