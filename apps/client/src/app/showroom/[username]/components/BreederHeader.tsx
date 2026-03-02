import type { BreederPublicProfile } from "../data";
import { MapPin, Phone, Share2 } from "lucide-react";
import { toast } from "@/lib/toast";

interface BreederHeaderProps {
  profile: BreederPublicProfile;
}

export default function BreederHeader({ profile }: BreederHeaderProps) {
  const handleShare = () => {
    const url = `${window.location.origin}/@${encodeURIComponent(profile.name)}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("쇼룸 링크가 복사되었습니다");
    });
  };

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
            {profile.name}&#39;s SHOWROOM
          </h1>
          <button
            type="button"
            onClick={handleShare}
            className="flex shrink-0 items-center gap-1 self-start rounded-lg stroke-1 px-2.5 py-1.5 text-xs text-amber-500 hover:bg-amber-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        {/* 닉네임 (실명과 다를 때) */}
        {profile.name && (
          <div className="flex items-center gap-1.5">
            <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.name}</p>
            {profile.isBiz && (
              <span className="inline-flex items-center rounded-full bg-[#DBEDDB] px-2 py-0.5 text-[11px] leading-none font-medium text-[#2B6A2F] dark:bg-[#1E3D1F] dark:text-[#A3D9A5]">
                사업자
              </span>
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
