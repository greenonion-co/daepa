import { useRef, useState } from "react";
import type { BreederPublicProfile } from "../data";
import { Camera, ChevronRight, MapPin, Pencil, Phone, Share2 } from "lucide-react";
import { useIsLoggedIn, useUser } from "@/hooks/useAuth";
import Link from "next/link";
import { shareShowroom } from "../utils/shareShowroom";
import { userControllerUpdateUserPrivateInfo } from "@repo/api-client";
import Image from "next/image";
import BreederBioModal from "./BreederBioModal";

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

  const [bio, setBio] = useState<string | null>(profile.bio ?? null);
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState(profile.bio ?? "");
  const [isSavingBio, setIsSavingBio] = useState(false);

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

  const handleBioSave = async () => {
    setIsSavingBio(true);
    try {
      const trimmed = bioInput.trim() || null;
      await userControllerUpdateUserPrivateInfo({ bio: trimmed } as any);
      setBio(trimmed);
      setIsEditingBio(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingBio(false);
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

          {/* 소개글 */}
          {bio && !isEditingBio && (
            <div className="my-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsBioModalOpen(true)}
                className="group flex items-center gap-3 rounded-lg border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white px-4 py-2 transition-all hover:shadow-sm dark:border-neutral-700 dark:from-neutral-800/80 dark:to-neutral-900"
              >
                <span className="text-[10px] font-medium tracking-[0.2em] text-neutral-500 uppercase dark:text-neutral-400">
                  About Us
                </span>
                <ChevronRight className="h-3 w-3 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
              </button>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => {
                    setBioInput(bio);
                    setIsEditingBio(true);
                  }}
                  className="rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          {!bio && isOwner && !isEditingBio && (
            <button
              type="button"
              onClick={() => setIsEditingBio(true)}
              className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 px-4 py-2 text-xs tracking-wide text-neutral-400 transition-colors hover:border-neutral-400 hover:text-neutral-500 dark:border-neutral-600 dark:text-neutral-500 dark:hover:border-neutral-500 dark:hover:text-neutral-400"
            >
              <div className="flex items-center gap-2">
                <div className="h-px w-3 bg-neutral-300 dark:bg-neutral-600" />
                <div className="h-1 w-1 rotate-45 border border-neutral-300 dark:border-neutral-600" />
                <div className="h-px w-3 bg-neutral-300 dark:bg-neutral-600" />
              </div>
              소개글을 작성해주세요
            </button>
          )}
          {isEditingBio && (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="브리더 소개글을 작성해주세요"
                maxLength={500}
                rows={4}
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:focus:border-blue-500"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{bioInput.length}/500</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioInput(bio ?? "");
                    }}
                    className="rounded-lg px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleBioSave}
                    disabled={isSavingBio}
                    className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isSavingBio ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
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

      {bio && (
        <BreederBioModal
          isOpen={isBioModalOpen}
          onClose={() => setIsBioModalOpen(false)}
          breederName={profile.name}
          bio={bio}
        />
      )}
    </div>
  );
}
