"use client";

import {
  ParentLinkDetailJson,
  userNotificationControllerFindAll,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import Link from "next/link";
import { keyframes } from "@emotion/react";
import styled from "@emotion/styled";
import { usePathname } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Tooltip } from "@/components/ui/tooltip";
import { TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { NOTIFICATION_TYPE } from "@/app/(브리더스룸)/constants";
import { castDetailJson } from "@/lib/utils";

const NOTI_BUTTON_QUERY_KEY = "layout-noti-button";

const ringBell = keyframes`
  0% { transform: rotate(0); }
  20% { transform: rotate(15deg); }
  40% { transform: rotate(-15deg); }
  60% { transform: rotate(7deg); }
  80% { transform: rotate(-7deg); }
  100% { transform: rotate(0); }
`;

const AnimatedBell = styled(Bell)`
  animation: none;
  &:hover {
    animation: ${ringBell} 0.5s ease-in-out;
  }
`;

const NotiButton = () => {
  const pathname = usePathname();
  const isNotiPage = pathname.includes("noti");

  const { data: notifications } = useQuery({
    queryKey: [userNotificationControllerFindAll.name, NOTI_BUTTON_QUERY_KEY],
    queryFn: () =>
      userNotificationControllerFindAll({
        itemPerPage: 5,
        order: "DESC",
      }),
    select: (response) => response.data.data,
  });

  const unreadCount =
    notifications?.filter((n) => n.status === UserNotificationDtoStatus.UNREAD).length || 0;
  const hasNotification = unreadCount > 0;

  const recentNotifications = notifications
    ?.filter((n) => n.status === UserNotificationDtoStatus.UNREAD)
    .map((n) => {
      const info = NOTIFICATION_TYPE[n.type as keyof typeof NOTIFICATION_TYPE];
      const rawMessage = castDetailJson<ParentLinkDetailJson>(n.type, n?.detailJson)?.message ?? "";
      const message = rawMessage.length > 50 ? `${rawMessage.slice(0, 50)}...` : rawMessage;

      return {
        title: info?.label ?? "알림",
        message,
        id: n.id,
      };
    });

  if (isNotiPage) return;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/noti" className="relative">
            <AnimatedBell
              className="h-5 w-5 text-sky-900"
              fill={hasNotification ? "currentColor" : "none"}
            />
            {hasNotification && (
              <span className="absolute -right-2 top-0 flex h-4 w-4 -translate-y-[25%] items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                {unreadCount}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="center"
          color="gray"
          className={recentNotifications?.length ? "w-80" : undefined}
        >
          {recentNotifications?.length ? (
            <div className="flex flex-col gap-2 p-1 pb-4 pt-2">
              <p className="font-medium">최근 알림</p>
              {recentNotifications.map((noti, index) => (
                <Link
                  href={`/noti?id=${noti.id}`}
                  key={index}
                  className="cursor-pointer rounded-md border border-gray-500 p-2 text-sm"
                >
                  <p className="font-medium text-gray-200 dark:text-gray-800">{noti.title}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-600">{noti.message}</p>
                </Link>
              ))}
              {unreadCount > 4 && (
                <p className="text-muted-foreground text-right text-xs dark:text-gray-800">
                  외 {unreadCount - 4}개의 알림이 있습니다.
                </p>
              )}
            </div>
          ) : (
            <p className="p-2 text-sm">새로운 알림이 없습니다.</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default NotiButton;
