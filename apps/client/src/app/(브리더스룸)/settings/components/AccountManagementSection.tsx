"use client";

import { LogOut, Trash2 } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";
import DeleteAccountButton from "./DeleteAccountButton";

const AccountManagementSection = () => {
  const { logout } = useLogout();

  return (
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
  );
};

export default AccountManagementSection;
