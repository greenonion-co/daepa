import type { BreederPublicProfile } from "../data";
import { MapPin, Phone } from "lucide-react";

interface BreederHeaderProps {
  profile: BreederPublicProfile;
}

export default function BreederHeader({ profile }: BreederHeaderProps) {
  const displayName = profile.realName || profile.name;

  return (
    <div className="flex items-center gap-4 px-4 py-4 sm:px-6">
      {/* 아바타 */}
      {/* <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-purple-200 text-xl font-bold text-white dark:from-blue-800 dark:to-purple-800">
        {displayName.charAt(0)}
      </div> */}

      {/* 정보 */}
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{displayName}</h1>
          {profile.isBiz && (
            <span className="inline-flex items-center rounded-full bg-[#DBEDDB] px-2 py-0.5 text-[11px] leading-none font-medium text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]">
              사업자
            </span>
          )}
        </div>

        {/* 닉네임 (실명과 다를 때) */}
        {profile.realName && profile.realName !== profile.name && (
          <p className="da rk:text-gray-400 text-sm text-gray-500">@{profile.name}</p>
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
