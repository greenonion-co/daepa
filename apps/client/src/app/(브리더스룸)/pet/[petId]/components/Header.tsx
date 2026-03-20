"use client";

import QRCode from "./QR코드";
import { cn } from "@/lib/utils";
import { PetDto } from "@repo/api-client";
import Link from "next/link";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { useEffect, useState } from "react";
import TooltipText from "@/app/(브리더스룸)/components/TooltipText";
import PetThumbnail, { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { UserProfileDtoRole } from "@repo/api-client";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { openRelationPromoSheet } from "@/app/(브리더스룸)/components/LoginPromoSheet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useBreedingInfoStore } from "../../store/breedingInfo";
import AdoptionStatusBadge from "@/app/(브리더스룸)/components/AdoptionStatusBadge";
import {
  RECENTLY_VIEWED_MAX_ITEMS,
  RECENTLY_VIEWED_STORAGE_KEY,
} from "@/app/(브리더스룸)/components/SidebarPanel/최근본";

type TabType = "breeding" | "adoption" | "images" | "pedigree" | "feeding";

interface HeaderProps {
  pet: PetDto;
  size?: "medium" | "small";
  tabs?: { id: TabType; label: string; ref: React.RefObject<HTMLDivElement | null> }[];
  activeTab?: TabType;
  onTabClick?: (tabId: TabType, ref: React.RefObject<HTMLDivElement | null>) => void;
}

const Header = ({
  pet,
  size = "medium",
  tabs = [],
  activeTab,
  onTabClick = () => {},
}: HeaderProps) => {
  const isMyPet = useIsMyPet(pet?.owner?.userId);
  const { isLoggedIn, user } = useAuth();
  const isBreeder =
    user?.role === UserProfileDtoRole.BREEDER || user?.role === UserProfileDtoRole.ADMIN;
  const router = useAppRouter();
  const [isScrolled, setIsScrolled] = useState(size === "small");

  const { data: thumbnail } = useQuery({
    queryKey: getPetThumbnailQueryKey(pet?.petId),
    queryFn: () => petImageControllerFindThumbnail(pet!.petId),
    select: (response) => response.data.data,
    enabled: !!pet,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // 최근 본 펫을 localStorage에 저장
  useEffect(() => {
    if (!pet) return;

    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_STORAGE_KEY);
      const currentList: Array<{ petId: string }> = stored ? JSON.parse(stored) : [];

      const newItem = {
        petId: pet.petId,
        name: pet.name,
        species: pet.species,
        photoUrl: thumbnail?.url,
        morphs: pet.morphs,
        hatchingDate: pet.hatchingDate,
      };

      // 중복 제거 후 새 항목을 맨 앞에 추가
      const updatedList = [
        newItem,
        ...currentList.filter((item) => item.petId !== pet.petId),
      ].slice(0, RECENTLY_VIEWED_MAX_ITEMS);

      localStorage.setItem(RECENTLY_VIEWED_STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event("recentlyViewedUpdated"));
    } catch (error) {
      console.error("Failed to save recently viewed pet:", error);
    }
  }, [pet, thumbnail]);

  const { breedingInfo } = useBreedingInfoStore();
  const breedingData = breedingInfo?.petId === pet?.petId ? breedingInfo : null;
  const { adoption } = useAdoptionStore();
  const adoptionData = adoption?.petId === pet?.petId ? adoption : null;

  // 저장 완료된 값만 헤더에 반영 (중복확인 통과 후 저장된 값)
  const displayName = breedingData?.name || pet?.name;
  const displaySex = breedingData?.sex ?? pet?.sex;
  const dotColor =
    displaySex === "M"
      ? "bg-[#2383E2] dark:bg-[#529CCA]"
      : displaySex === "F"
        ? "bg-[#E03E3E] dark:bg-[#FF7369]"
        : "bg-gray-300";

  if (!pet) return null;

  return (
    <div
      className={cn(
        "dark:bg-background sticky top-0 z-20 flex flex-col gap-2 bg-gray-100 px-2 transition-all duration-200",
        isScrolled ? "pt-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] min-[581px]:pb-2" : "",
        size === "small" &&
          "before:dark:bg-background top-1.5 before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:bg-gray-100 min-[581px]:pb-2", // 모달에서 X 버튼 아래로 위치
      )}
    >
      {/* 썸네일 + 정보 영역 */}
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "relative flex items-center justify-center rounded-2xl transition-all",
            isScrolled ? "h-14 w-14" : "h-18 w-18",
          )}
        >
          <PetThumbnail petId={pet.petId} maxSize={72} objectFit="cover" />
        </div>
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-2">
            {displayName ? (
              <div
                className={cn(
                  "flex font-bold transition-all max-[480px]:text-[14px]",
                  isScrolled ? "text-[14px]" : "text-[16px]",
                )}
              >
                {displayName}
              </div>
            ) : (
              <div
                className={cn(
                  "flex items-center gap-1 font-bold transition-all",
                  isScrolled ? "text-[14px]" : "text-[16px]",
                )}
              >
                {pet.father && "petId" in pet.father && "name" in pet.father ? (
                  <Link
                    href={`/pet/${pet.father.petId}`}
                    className="cursor-pointer text-blue-600 hover:underline"
                  >
                    {pet.father?.name}
                  </Link>
                ) : (
                  "-"
                )}
                x
                {pet.mother && "petId" in pet.mother && "name" in pet.mother ? (
                  <Link
                    href={`/pet/${pet.mother.petId}`}
                    className="cursor-pointer text-blue-600 hover:underline"
                  >
                    {pet.mother?.name}
                  </Link>
                ) : (
                  "-"
                )}
              </div>
            )}
            <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
          </div>

          <div className="flex items-center gap-1">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-none font-medium",
                breedingData?.isPublic
                  ? "bg-[#35B0AB] text-white dark:bg-[#2B9A94]"
                  : "bg-[#D5D5D4] text-[#55534E] dark:bg-[#3F3F3F] dark:text-[#9B9A97]",
              )}
            >
              {breedingData?.isPublic ? "공개" : "비공개"}
            </span>
            {adoptionData?.status && <AdoptionStatusBadge status={adoptionData.status} />}
          </div>

          {pet.owner?.name && (
            <button
              type="button"
              onClick={() => router.push(`/@${encodeURIComponent(pet.owner!.name!)}`)}
              className="mt-1 w-fit text-left text-[12px] font-medium text-blue-500 transition-colors hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
            >
              @{pet.owner.name}
            </button>
          )}

          <div
            className={cn(
              "font-semibold text-green-600 transition-all max-[480px]:text-[16px]",
              isScrolled ? "text-[16px]" : "text-[18px]",
            )}
          >
            {adoptionData?.price && `${adoptionData.price.toLocaleString()}원`}
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col items-end gap-1 sm:flex-row-reverse sm:items-center",
            size === "small" && "mt-2",
          )}
        >
          <div className="flex items-center gap-1">
            {/* QR코드 */}
            <QRCode pet={pet} isScrolled={isScrolled} />
            {/* 공유 */}
            <Button
              size="sm"
              variant="outline"
              aria-label="펫 페이지 링크 복사"
              title="링크 복사"
              onClick={async () => {
                const url = `${window.location.origin}/pet/${pet.petId}`;
                try {
                  await navigator.clipboard.writeText(url);
                  toast.success("펫 페이지 링크가 복사되었습니다");
                } catch {
                  toast.error("링크 복사에 실패했습니다");
                }
              }}
              className={cn(
                "text-amber-500 hover:bg-amber-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800",
                isScrolled ? "text-xs" : "text-sm",
              )}
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-1">
            {/* 브리딩맵 */}
            {isLoggedIn && isMyPet && isBreeder && (
              <button
                type="button"
                onClick={() => router.push(`/pet/${pet.petId}/breeding-map`)}
                className={cn(
                  "flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gradient-to-r from-blue-200/50 to-purple-200/65 px-2 font-[700] text-white transition-colors hover:from-blue-200/70 hover:to-purple-200/80 dark:border-gray-700 dark:from-blue-900/40 dark:to-purple-900/50 dark:hover:from-blue-900/60 dark:hover:to-purple-900/70",
                  isScrolled ? "h-8 text-xs" : "h-8 text-sm",
                )}
              >
                <TooltipText
                  text="브리딩맵"
                  title="브리딩맵"
                  className="text-blue-600 dark:text-purple-300"
                  content="혈통 관계를 트리 구조로 확인합니다."
                />
              </button>
            )}
            {/* 관계도 */}
            <button
              type="button"
              onClick={() => {
                if (isLoggedIn) {
                  router.push(`/pet/${pet.petId}/relation`);
                } else {
                  openRelationPromoSheet();
                }
              }}
              className={cn(
                "flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white px-2 font-[700] transition-colors hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
                isScrolled ? "h-8 text-xs" : "h-8 text-sm",
              )}
            >
              <TooltipText
                text="관계도"
                title="개체 관계도"
                className="text-gray-600 dark:text-gray-300"
                content="혈통 관계가 있는 개체들을 확인합니다."
              />
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Only visible on screens 580px or smaller */}
      <div className="hidden overflow-x-auto border-b border-gray-200 max-[580px]:flex dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id, tab.ref)}
            className={cn(
              "px-4 py-2 text-sm whitespace-nowrap transition-colors",
              activeTab === tab.id
                ? "border-b-2 border-neutral-800 font-[600] dark:border-white"
                : "text-neutral-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Header;
