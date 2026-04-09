import { useRef, useState } from "react";
import type { BreederPublicProfile } from "../data";
import { BadgeCheck, Camera, MapPin, Phone, Share2 } from "lucide-react";
import { useIsLoggedIn, useUser } from "@/hooks/useAuth";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { shareShowroom } from "../utils/shareShowroom";
import { userControllerUpdateUserPrivateInfo } from "@repo/api-client";
import Image from "next/image";

interface BreederHeaderProps {
  profile: BreederPublicProfile;
}

export default function BreederHeader({ profile }: BreederHeaderProps) {
  const isLoggedIn = useIsLoggedIn();
  const user = useUser();
  const isOwner = isLoggedIn && user?.userId === profile.userId;

  const [bannerUrl, setBannerUrl] = useState<string | null>(profile.bannerImageUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleShare = () => shareShowroom(profile.name);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload/banner", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("업로드 실패");

      const { url } = await uploadRes.json();

      await userControllerUpdateUserPrivateInfo({ bannerImageUrl: url });

      setBannerUrl(url);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBannerDelete = async () => {
    if (!bannerUrl) return;

    setIsUploading(true);
    try {
      await userControllerUpdateUserPrivateInfo({ bannerImageUrl: null });

      fetch("/api/upload/banner", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: bannerUrl }),
      }).catch(() => {});

      setBannerUrl(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      {/* 배너 영역 — 이미지 없으면 타인에게 숨김 */}
      {(bannerUrl || isOwner) && (
        <div
          className={`relative aspect-video max-h-48 w-full overflow-hidden ${
            bannerUrl
              ? ""
              : "border-2 border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800/50"
          }`}
        >
          {bannerUrl ? (
            <Image
              src={bannerUrl}
              alt="쇼룸 배너"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-full w-full flex-col items-center justify-center gap-2 text-gray-400 transition-colors hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <Camera className="h-6 w-6" />
              <span className="text-sm">배너 이미지를 추가해주세요</span>
            </button>
          )}

          {isOwner && (
            <>
              <button
                type="button"
                onClick={bannerUrl ? handleBannerDelete : () => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute right-3 bottom-3 flex items-center gap-1.5 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70 disabled:opacity-50"
              >
                <Camera className="h-3.5 w-3.5" />
                {isUploading ? "처리 중..." : bannerUrl ? "배너 삭제" : "배너 추가"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />
            </>
          )}
        </div>
      )}

      {/* 프로필 정보 */}
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
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
    </div>
  );
}
