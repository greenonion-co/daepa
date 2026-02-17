"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CircleAlert } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { userControllerGetUserProfile } from "@repo/api-client";
import { SettingsGroup } from "./SettingsGroup";

const ProfileSection = () => {
  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: (response) => response.data.data,
  });

  return (
    <SettingsGroup className="px-2">
      <div className="flex items-center gap-4 bg-neutral-100 p-2 px-4 dark:bg-[#18171C]">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <CircleAlert className={"my-4 opacity-40"} width={60} height={60} />
        </div>
        {userProfile?.userId && (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                {userProfile?.name ?? "사용자"}
              </h2>
              <Badge
                className={cn(
                  "text-[11px] font-[600]",
                  userProfile?.isBiz
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-blue-600 hover:bg-blue-700",
                )}
              >
                {userProfile?.isBiz ? "사업자" : "일반"}
              </Badge>
            </div>
            <p className="text-[13px] text-gray-500 dark:text-gray-400">
              {userProfile?.email ?? ""}
            </p>
          </div>
        )}
      </div>
    </SettingsGroup>
  );
};

export default ProfileSection;
