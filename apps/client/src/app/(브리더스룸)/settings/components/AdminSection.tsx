"use client";

import { ShieldCheck } from "lucide-react";
import { UserProfileDtoRole } from "@repo/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useAppRouter } from "@/hooks/useAppRouter";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const AdminSection = () => {
  const { user } = useAuth();
  const router = useAppRouter();

  // 관리자에게만 노출
  if (user?.role !== UserProfileDtoRole.ADMIN) return null;

  return (
    <SettingsGroup title="관리자">
      <SettingsItem
        icon={<ShieldCheck className="h-5 w-5" />}
        iconBgColor="bg-purple-100 dark:bg-purple-900/30"
        iconColor="text-purple-600 dark:text-purple-400"
        label="관리자 기능"
        showChevron
        onClick={() => router.push("/admin")}
      />
    </SettingsGroup>
  );
};

export default AdminSection;
