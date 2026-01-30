"use client";

import { cn } from "@/lib/utils";
import NotificationList from "./알림";
import RecentlyViewedList from "./최근본";
import SettingList from "./설정";

interface SidebarPanelProps {
  isOpen: boolean;
  type?: "알림" | "최근 본" | "설정";
}

const SidebarPanel = ({ isOpen, type }: SidebarPanelProps) => {
  return (
    <div
      className={cn(
        "fixed top-0 right-[55px] z-35 h-full w-[315px] border-x bg-gray-100 shadow-lg transition-transform duration-300 dark:border-gray-900 dark:bg-black",
        isOpen ? "translate-x-0" : "translate-x-[315px]",
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h2 className="text-lg font-semibold dark:text-gray-100">{type}</h2>
        </div>

        {isOpen && type === "알림" && <NotificationList />}
        {isOpen && type === "최근 본" && <RecentlyViewedList />}
        {isOpen && type === "설정" && <SettingList />}
      </div>
    </div>
  );
};

export default SidebarPanel;
