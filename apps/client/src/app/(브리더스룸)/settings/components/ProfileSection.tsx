"use client";

import { cn } from "@/lib/utils";
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
        {/* <div className="relative flex h-16 w-16 items-center justify-center">
          <CircleAlert className={"my-4 opacity-40"} width={60} height={60} />
        </div> */}
        {userProfile?.userId && (
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[17px] font-semibold text-gray-900 dark:text-white">
                {userProfile?.name ?? "사용자"}
              </h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
                  userProfile?.isBiz
                    ? "bg-[#DBEDDB] text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]"
                    : "bg-[#D3E5EF] text-[#28638D] dark:bg-[#1E3A5F] dark:text-[#A3C9E8]",
                )}
              >
                {userProfile?.isBiz ? "사업자" : "일반"}
              </span>
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
