"use client";

import QRCode from "./QR코드";
import { cn } from "@/lib/utils";
import { PetAdoptionDtoStatus, PetDto } from "@repo/api-client";
import { SPECIES_KOREAN_ALIAS_INFO } from "@/app/(브리더스룸)/constants";
import Link from "next/link";
import { DeletePetDialog } from "./DeletePetDialog";
import { useAdoptionStore } from "@/app/(브리더스룸)/pet/store/adoption";
import { useEffect, useState } from "react";
import TooltipText from "@/app/(브리더스룸)/components/TooltipText";
import PetThumbnail from "@/components/common/PetThumbnail";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import LoginPromoSheet from "@/app/(브리더스룸)/components/LoginPromoSheet";
import { useBreedingInfoStore } from "../../store/breedingInfo";
import { useModalContext } from "./ModalContext";

type TabType = "breeding" | "adoption" | "images" | "pedigree";

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
  const modalContext = useModalContext();
  const isMyPet = useIsMyPet(pet.owner.userId);
  const { user } = useUserStore();
  const isLoggedIn = !!user?.userId;
  const [isScrolled, setIsScrolled] = useState(size === "small");
  const [isPromoSheetOpen, setIsPromoSheetOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
          <PetThumbnail petId={pet.petId} maxSize={72} />
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

        <Link
          href={`/pet/${pet.petId}/relation`}
          onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              setIsPromoSheetOpen(true);
            }
            // 모달에서는 모달 닫고 soft navigation으로 이동
            else if (modalContext) {
              e.preventDefault();
              modalContext.navigateAway(`/pet/${pet.petId}/relation`);
            }
            // 일반 페이지에서는 Link 기본 동작 사용
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
        </Link>

        <LoginPromoSheet
          isOpen={isPromoSheetOpen}
          onOpenChange={setIsPromoSheetOpen}
          title="펫의 가족 관계를 한눈에"
          description={
            <>
              <span className="font-semibold text-blue-700">부모, 형제, 자녀</span>까지
              <br />
              <span className="font-semibold text-gray-800">펫 관계도</span> 로 혈통을 쉽게 확인할
              수 있어요
            </>
          }
        />

        <div className="flex items-center gap-1">
          <QRCode pet={pet} isScrolled={isScrolled} />
          {isLoggedIn && isMyPet && <DeletePetDialog petId={pet.petId} petName={pet.name} />}
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
