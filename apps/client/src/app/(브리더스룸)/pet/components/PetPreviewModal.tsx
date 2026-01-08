"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { petControllerFindPetByPetId, PetDto } from "@repo/api-client";

import { cn } from "@/lib/utils";

import { useIsMobile } from "@/hooks/useMobile";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";

import "swiper/css";
import "swiper/css/pagination";
import PedigreeInfo from "../[petId]/components/혈통정보";
import AdoptionInfo from "../[petId]/components/분양정보";
import BreedingInfo from "../[petId]/components/펫정보";
import Images from "../[petId]/components/이미지";
import { usePetPreviewModal } from "../store/petPreviewModal";
import Loading from "@/components/common/Loading";
import Header from "../[petId]/components/Header";

const PetPreviewModal = () => {
  const isMobile = useIsMobile();
  const hasAddedHistoryRef = useRef(false);
  const { isOpen, pet: storePet, petId, close } = usePetPreviewModal();

  // petId로 열렸을 때 pet 데이터 fetch
  const { data: fetchedPet, isLoading } = useQuery({
    queryKey: [petControllerFindPetByPetId.name, petId],
    queryFn: () => petControllerFindPetByPetId(petId!),
    select: (response) => response.data.data as unknown as PetDto,
    enabled: isOpen && !!petId && !storePet,
  });

  // storePet이 있으면 사용, 없으면 fetchedPet 사용
  const pet = storePet ?? fetchedPet;

  // 뒤로가기 버튼으로 모달 닫기 (모바일 + PC 모두 지원)
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    // 모달이 열릴 때 히스토리 상태 추가
    if (!hasAddedHistoryRef.current) {
      window.history.pushState({ modal: "pet-preview" }, "");
      hasAddedHistoryRef.current = true;
    }

    const handlePopState = () => {
      // 뒤로가기 시 모달 닫기
      if (hasAddedHistoryRef.current) {
        hasAddedHistoryRef.current = false;
        close();
      }
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isOpen, close]);

  // 모달이 닫힐 때 (뒤로가기가 아닌 경우) 히스토리 정리
  useEffect(() => {
    if (!isOpen && hasAddedHistoryRef.current) {
      window.history.back();
      hasAddedHistoryRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 로딩 중이거나 pet 데이터가 없으면 로딩 표시
  if (isLoading || !pet) {
    return (
      <Dialog open={isOpen} onOpenChange={close}>
        <DialogContent
          className={cn(
            "flex flex-col overflow-hidden bg-gray-100",
            isMobile
              ? "h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none p-2"
              : "max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-[900px]",
          )}
        >
          <DialogTitle className="sr-only">펫 정보 로딩 중</DialogTitle>
          <div className="flex flex-1 items-center justify-center">
            <Loading />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={close}>
      <DialogContent
        className={cn(
          "flex flex-col gap-0 overflow-hidden bg-gray-100 px-0 pb-0 pt-[16px]",
          isMobile
            ? "h-[100dvh] max-h-[100dvh] w-full max-w-full rounded-none"
            : "max-h-[90vh] w-[calc(100%-2rem)] sm:max-w-[900px]",
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex flex-1 flex-col">
            <Header pet={pet} size="small" />
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 py-2">
          <div className={cn(!isMobile ? "flex gap-2" : "space-y-2")}>
            {/* 이미지 캐러셀 */}
            <Images pet={pet} />

            {/* 기본 정보 */}
            <BreedingInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
          </div>

          <div className={cn("flex gap-2", !isMobile ? "" : "flex-col")}>
            {/* 혈통정보 */}
            <PedigreeInfo species={pet.species} petId={pet.petId} userId={pet.owner.userId ?? ""} />

            <AdoptionInfo petId={pet.petId} ownerId={pet.owner.userId ?? ""} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PetPreviewModal;
