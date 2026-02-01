import { ChevronsLeft, Clock7, Mail, Settings } from "lucide-react";
import { useState } from "react";
import SidebarPanel from "./SidebarPanel";
import { cn } from "@/lib/utils";
import { useUserStore } from "../store/user";

type SIDEBAR_TYPE = "알림" | "최근 본" | "설정";

const Sidebar = ({ unreadCount }: { unreadCount: number }) => {
  const isLoggedIn = useUserStore((state) => !!state.user?.userId);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [type, setType] = useState<SIDEBAR_TYPE>(isLoggedIn ? "알림" : "최근 본");

  const handleClickSidebarItem = (selectedType: SIDEBAR_TYPE) => {
    setType(selectedType);
    if (isNotificationOpen && type !== selectedType) {
      return;
    }
    setIsNotificationOpen((prev) => !prev);
  };

  return (
    <>
      <div className="fixed top-0 right-0 z-40 flex h-full w-[55px] flex-col items-center gap-2 bg-gray-100 dark:bg-black">
        <SidebarItem
          icon={
            <ChevronsLeft
              className={cn(
                "h-7 w-7 text-gray-500 transition-transform duration-300 dark:text-neutral-400",
                isNotificationOpen && "rotate-180",
              )}
            />
          }
          onClick={() => setIsNotificationOpen((prev) => !prev)}
          aria-label={isNotificationOpen ? "사이드바 닫기" : "사이드바 열기"}
        />
        {isLoggedIn && (
          <SidebarItem
            icon={
              <div className="relative">
                <Mail className="text-gray-500 dark:text-neutral-400" />
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[12px] font-medium text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </div>
                )}
              </div>
            }
            label="알림"
            selected={isNotificationOpen && type === "알림"}
            onClick={() => handleClickSidebarItem("알림")}
          />
        )}

        <SidebarItem
          icon={<Clock7 className="text-gray-500 dark:text-neutral-400" />}
          label="최근 본"
          selected={isNotificationOpen && type === "최근 본"}
          onClick={() => handleClickSidebarItem("최근 본")}
        />

        <SidebarItem
          icon={<Settings className="text-gray-500 dark:text-neutral-400" />}
          label="설정"
          selected={isNotificationOpen && type === "설정"}
          onClick={() => handleClickSidebarItem("설정")}
        />
      </div>
      <SidebarPanel type={type} isOpen={isNotificationOpen} />
    </>
  );
};

export default Sidebar;

const SidebarItem = ({
  icon,
  label,
  selected,
  onClick,
  "aria-label": ariaLabel,
}: {
  icon: React.ReactNode;
  label?: string;
  selected?: boolean;
  onClick?: () => void;
  "aria-label"?: string;
}) => {
  return (
    <div className="flex h-[64px] items-center justify-center">
      <button
        type="button"
        className="flex flex-col items-center"
        onClick={onClick}
        aria-label={ariaLabel}
      >
        <div
          className={cn(
            "rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-neutral-800",
            selected && "bg-gray-200 dark:bg-neutral-800",
          )}
        >
          {icon}
        </div>
        <span className="text-[12px] font-[500] text-gray-500 dark:text-neutral-400">{label}</span>
      </button>
    </div>
  );
};
