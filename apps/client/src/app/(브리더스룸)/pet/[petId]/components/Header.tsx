"use client";

import QRCode from "./QR코드";
import { cn } from "@/lib/utils";
import { PetAdoptionDtoStatus, PetDto } from "@repo/api-client";
import { SPECIES_KOREAN_ALIAS_INFO } from "@/app/(브리더스룸)/constants";
import Link from "next/link";
import DeletePetButton from "./DeletePetButton";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { useEffect, useState } from "react";
import TooltipText from "@/app/(브리더스룸)/components/TooltipText";
import PetThumbnail, { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { petImageControllerFindThumbnail } from "@repo/api-client";
import { useQuery } from "@tanstack/react-query";
import { useIsLoggedIn } from "@/hooks/useAuth";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { openRelationPromoSheet } from "@/app/(브리더스룸)/components/LoginPromoSheet";
import { useAppRouter } from "@/hooks/useAppRouter";
import { useBreedingInfoStore } from "../../store/breedingInfo";
import {
  RECENTLY_VIEWED_MAX_ITEMS,
  RECENTLY_VIEWED_STORAGE_KEY,
} from "@/app/(브리더스룸)/components/SidebarPanel/최근본";

type TabType = "breeding" | "adoption" | "images" | "pedigree";

interface HeaderProps {
  pet: PetDto;
  size?: "medium" | "small";
  tabs?: { id: TabType; label: string; ref: React.RefObject<HTMLDivElement | null> }[];
  activeTab?: TabType;
  onTabClick?: (tabId: TabType, ref: React.RefObject<HTMLDivElement | null>) => void;
  /** 펫 삭제 성공 시 콜백 */
  onDelete?: () => void;
}

const Header = ({
  pet,
  size = "medium",
  tabs = [],
  activeTab,
  onTabClick = () => {},
  onDelete,
}: HeaderProps) => {
  const isMyPet = useIsMyPet(pet.owner.userId);
  const isLoggedIn = useIsLoggedIn();
  const router = useAppRouter();
  const [isScrolled, setIsScrolled] = useState(size === "small");

  const { data: thumbnail } = useQuery({
    queryKey: getPetThumbnailQueryKey(pet.petId),
    queryFn: () => petImageControllerFindThumbnail(pet.petId),
    select: (response) => response.data.data,
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

  if (!pet) return null;

  return (
    <div
      className={cn(
        "dark:bg-background sticky top-0 z-20 flex flex-col gap-2 bg-gray-100 px-2 transition-all transition-shadow duration-200",
        isScrolled ? "pt-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]" : "",
        size === "small" &&
          "before:dark:bg-background top-2 before:absolute before:-top-2 before:right-0 before:left-0 before:h-2 before:bg-gray-100", // 모달에서 X 버튼 아래로 위치
      )}
    >
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
            {pet.name ? (
              <div
                className={cn(
                  "flex font-bold transition-all max-[480px]:text-[14px]",
                  isScrolled ? "text-[14px]" : "text-[16px]",
                )}
              >
                {pet.name}
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
            <div
              className={cn(
                "flex-1 text-gray-500 transition-all max-[480px]:text-xs dark:text-gray-400",
                isScrolled ? "text-xs" : "text-sm",
              )}
            >
              {SPECIES_KOREAN_ALIAS_INFO[pet.species]}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div
              className={cn(
                "flex w-fit items-center justify-center rounded-md px-2 font-semibold text-white transition-all max-[480px]:h-[22px] max-[480px]:text-xs",
                isScrolled ? "h-[22px] text-xs" : "h-[26px] text-sm",
                breedingData?.isPublic ? "bg-neutral-800" : "bg-yellow-500 text-neutral-700",
              )}
            >
              {breedingData?.isPublic ? "공개" : "비공개"}
            </div>
            {adoptionData?.status === PetAdoptionDtoStatus.NFS && (
              <div
                className={cn(
                  "flex w-fit items-center justify-center rounded-md bg-pink-500 px-2 font-semibold text-white transition-all max-[480px]:h-[22px] max-[480px]:text-xs",
                  isScrolled ? "h-[22px] text-xs" : "h-[26px] text-sm",
                )}
              >
                NFS
              </div>
            )}
          </div>

          <div
            className={cn(
              "font-semibold text-green-600 transition-all max-[480px]:text-[16px]",
              isScrolled ? "text-[16px]" : "text-[18px]",
            )}
          >
            {adoptionData?.price && `${adoptionData.price.toLocaleString()}원`}
          </div>
        </div>

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
            "flex items-center gap-0.5 rounded-lg bg-blue-100 px-2 font-[700] text-white transition-colors hover:bg-blue-200 dark:bg-blue-900/40 dark:hover:bg-blue-800/40",
            isScrolled ? "h-8 text-xs" : "h-8 text-sm",
          )}
        >
          <TooltipText
            text="펫 관계도"
            title="펫 관계도"
            className="text-blue-600"
            content="혈통 관계가 있는 펫들을 확인합니다."
          />
        </button>

        <div className="flex items-center gap-1">
          <QRCode pet={pet} isScrolled={isScrolled} />
          {isLoggedIn && isMyPet && (
            <DeletePetButton petId={pet.petId} petName={pet.name} onSuccess={onDelete} />
          )}
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
