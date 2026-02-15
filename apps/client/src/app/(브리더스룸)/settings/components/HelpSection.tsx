"use client";

import { HelpCircle, Mail, FileText, Shield } from "lucide-react";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const HelpSection = () => {
  return (
    <SettingsGroup title="도움말">
      <SettingsItem
        icon={<HelpCircle className="h-4 w-4" />}
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
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
        iconBgColor="bg-teal-100 dark:bg-teal-900/30"
        iconColor="text-teal-600 dark:text-teal-400"
        label="이용약관"
        showChevron
        onClick={() => {}}
      />
      <SettingsItem
        icon={<Shield className="h-4 w-4" />}
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
