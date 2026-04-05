import type { BreederPublicProfile } from "../data";
import { BadgeCheck, MapPin, Phone, Share2 } from "lucide-react";
import { useIsLoggedIn } from "@/hooks/useAuth";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shareShowroom } from "../utils/shareShowroom";

interface BreederHeaderProps {
  profile: BreederPublicProfile;
}

export default function BreederHeader({ profile }: BreederHeaderProps) {
  const isLoggedIn = useIsLoggedIn();

  const handleShare = () => shareShowroom(profile.name);

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
      {/* 아바타 */}
      {/* <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-purple-200 text-xl font-bold text-white dark:from-blue-800 dark:to-purple-800">
        {displayName.charAt(0)}
      </div> */}

      {/* 정보 */}
      <div className="flex w-full flex-col gap-0.5">
        <div className="flex w-full items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {profile.name}
            <span style={{ marginLeft: 4, fontFamily: "Yeongwol, sans-serif" }}>
              &#39;s SHOWROOM
            </span>
          </h1>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleShare}
              className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-500 hover:bg-amber-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Share2 className="h-4 w-4" />
            </button>
            {!isLoggedIn && (
              <Link
                href="/sign-in"
                className="shrink-0 rounded-lg border border-blue-200 px-3 py-1 text-xs font-medium text-blue-500 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-900/30"
              >
                로그인
              </Link>
            )}
          </div>
        </div>

        {/* 닉네임 (실명과 다를 때) */}
        {profile.name && (
          <div className="flex items-center gap-0.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.name}</p>
            {profile.isBiz && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <BadgeCheck className="h-5 w-5 fill-blue-500 stroke-white" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>사업자 인증 완료</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* 연락처 / 주소 */}
        {(profile.phone || profile.address) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-blue-500 dark:text-blue-400">
            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <Phone className="h-3 w-3" />
                {profile.phone}
              </a>
            )}
            {profile.address && (
              <a
                href={`https://map.naver.com/v5/search/${encodeURIComponent(profile.address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-300"
              >
                <MapPin className="h-3 w-3" />
                {profile.address}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
