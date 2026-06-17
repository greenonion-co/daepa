"use client";

import { Megaphone, MessageCircle } from "lucide-react";
import { UserProfileDtoRole } from "@repo/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useAppRouter } from "@/hooks/useAppRouter";
import { SettingsGroup } from "../settings/components/SettingsGroup";
import { SettingsItem } from "../settings/components/SettingsItem";

// 관리자 기능 목록 — 새 기능 추가 시 항목만 추가
const ADMIN_FEATURES = [
  {
    label: "공지 푸시 발송",
    href: "/admin/announcement",
    icon: <Megaphone className="h-5 w-5" />,
    iconBgColor: "bg-purple-100 dark:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
  {
    label: "1:1 문의 관리",
    href: "/admin/inquiry",
    icon: <MessageCircle className="h-5 w-5" />,
    iconBgColor: "bg-blue-100 dark:bg-blue-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
];

export default function AdminPage() {
  const { user } = useAuth();
  const router = useAppRouter();

  if (!user || user.role !== UserProfileDtoRole.ADMIN) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        접근 권한이 없습니다.
      </div>
    );
  }

  return (
    <div className="min-h-screen py-4">
      <SettingsGroup title="관리자 기능">
        {ADMIN_FEATURES.map((feature) => (
          <SettingsItem
            key={feature.href}
            icon={feature.icon}
            iconBgColor={feature.iconBgColor}
            iconColor={feature.iconColor}
            label={feature.label}
            showChevron
            onClick={() => router.push(feature.href)}
          />
        ))}
      </SettingsGroup>
    </div>
  );
}
