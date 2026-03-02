"use client";

import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const HelpSection = () => {
  return (
    <SettingsGroup title="도움말">
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="자주 묻는 질문"
        showChevron
        onClick={() => {}}
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="고객센터 문의"
        showChevron
        onClick={() => {}}
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="이용약관"
        showChevron
        onClick={() => {}}
      />
      <SettingsItem
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="개인정보처리방침"
        showChevron
        onClick={() => {}}
      />
    </SettingsGroup>
  );
};

export default HelpSection;
