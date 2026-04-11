"use client";

import { useCallback } from "react";
import { PetDto } from "@repo/api-client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import PetDetailLayout from "./PetDetailLayout";
import BreedingInfoContent from "./BreedingInfoContent";
import ImagesContent from "./ImagesContent";
import PedigreeInfoContent from "./PedigreeInfoContent";
import AdoptionInfoContent from "./AdoptionInfoContent";
import FeedingInfoContent from "./FeedingInfoContent";
import { useFlush } from "./FlushContext";
import { useNameStore } from "@/app/(브리더스룸)/store/name";
import { DUPLICATE_CHECK_STATUS } from "@/app/(브리더스룸)/constants";

// memo 비교 시 매 렌더마다 새 참조가 생성되지 않도록 상수로 분리
const EMPTY_IMAGES: never[] = [];

interface PetDetailModalProps {
  isOpen: boolean;
  pet: PetDto;
  onClose: () => void;
}

export default function PetDetailModal({ isOpen, pet, onClose }: PetDetailModalProps) {
  const { flushRef, flushAll, FlushProvider } = useFlush();

  const setDuplicateCheckStatus = useNameStore((s) => s.setDuplicateCheckStatus);

  /**
   * 모달 닫기 핸들러
   *
   * flushAll()은 모달 내부에서 아직 저장되지 않은 blur 필드(desc, weight, temperature, price, memo)를
   * 서버에 저장하고, 동시에 patchPetListCache로 React Query 인메모리 캐시
   * (brPetControllerFindAll 쿼리 — 브리더스룸 펫 목록 테이블의 무한스크롤 데이터)를 직접 패치한다.
   * 즉시 저장 필드(name, sex, growth, isPublic 등)는 변경 시점에 이미 캐시 패치 + API 호출이 완료된 상태.
   *
   * 따라서 모달 닫을 때 invalidateQueries로 전체 목록을 서버에서 refetch할 필요가 없다.
   * (수천 개의 펫 목록을 매번 재조회하는 서버 부하를 절감)
   */
  const handleClose = useCallback(() => {
    setDuplicateCheckStatus(DUPLICATE_CHECK_STATUS.NONE);
    onClose();
    flushAll();
  }, [flushAll, onClose, setDuplicateCheckStatus]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pt-[16px] pb-0 sm:max-w-full md:h-auto md:max-h-[90dvh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl dark:bg-neutral-800">
        <DialogTitle className="sr-only">개체 상세 정보</DialogTitle>
        <FlushProvider value={flushRef}>
          <PetDetailLayout
            variant="modal"
            pet={pet}
            onDelete={handleClose}
            breedingSlot={
              <BreedingInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                initialPet={pet}
              />
            }
            imagesSlot={<ImagesContent pet={pet} initialImages={EMPTY_IMAGES} />}
            pedigreeSlot={
              <PedigreeInfoContent
                species={pet.species}
                petId={pet.petId}
                userId={pet.owner.userId ?? ""}
                initialParents={null}
              />
            }
            adoptionSlot={
              <AdoptionInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                initialAdoption={null}
                onClose={handleClose}
              />
            }
            feedingSlot={
              <FeedingInfoContent
                petId={pet.petId}
                ownerId={pet.owner.userId ?? ""}
                defaultFoods={pet.foods}
              />
            }
          />
        </FlushProvider>
      </DialogContent>
    </Dialog>
  );
}
