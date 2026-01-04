"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

import { DateTime } from "luxon";
import { SPECIES_KOREAN_INFO } from "../../constants";
import {
  AdoptionDtoStatus,
  brPetControllerFindAll,
  BrPetControllerFindAllOrder,
  PetAdoptionDtoStatus,
  PetControllerFindAllFilterType,
  PetDto,
} from "@repo/api-client";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import EditAdoptionForm from "./EditAdoptionForm";
import { AdoptionEditFormDto } from "../types";
import { Button } from "@/components/ui/button";
import Header from "../../components/selector/parentSearch/Header";
import { toast } from "sonner";
import PetItem from "../../components/selector/PetItem";
import Loading from "@/components/common/Loading";
import SingleSelect from "../../components/selector/SingleSelect";
import Image from "next/image";

const CREATE_ADOPTION_MODAL_STEP = {
  PET_SELECT: 1,
  ADOPTION_INFO: 2,
};

interface EditAdoptionModalProps {
  isOpen: boolean;
  status?: AdoptionDtoStatus;
  adoptionData?: AdoptionEditFormDto[];
  pet?: PetDto;
  onClose: () => void;
  onSuccess: () => void;
}

const EditAdoptionModal = ({
  isOpen,
  status,
  adoptionData,
  pet,
  onClose,
  onSuccess,
}: EditAdoptionModalProps) => {
  const [step, setStep] = useState(
    pet ? CREATE_ADOPTION_MODAL_STEP.ADOPTION_INFO : CREATE_ADOPTION_MODAL_STEP.PET_SELECT,
  );
  const [selectedPet, setSelectedPet] = useState<PetDto | undefined>(pet);
  const [keyword, setKeyword] = useState("");
  const { ref, inView } = useInView();
  const itemPerPage = 10;
  const [tab, setTab] = useState<"M" | "F">("M");
  const {
    data: pets,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    enabled: !pet,
    queryKey: [brPetControllerFindAll.name, keyword],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: BrPetControllerFindAllOrder.DESC,
        keyword,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) => data.pages.flatMap((page) => page.data.data),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleClose = () => {
    setStep(CREATE_ADOPTION_MODAL_STEP.PET_SELECT);
    setSelectedPet(undefined);
    setKeyword("");
    onClose();
  };

  const handlePetSelect = (pet: PetDto) => {
    if (pet.adoption?.status === PetAdoptionDtoStatus.NONE) {
      toast.error("이미 분양 정보가 있습니다.");
      return;
    }

    setSelectedPet(pet);
    setStep(CREATE_ADOPTION_MODAL_STEP.ADOPTION_INFO);
  };

  const getAdoptionData = (): AdoptionEditFormDto | null => {
    if (!selectedPet) return null;

    if (selectedPet.adoption?.adoptionId) {
      return {
        ...selectedPet.adoption,
        status: status ?? AdoptionDtoStatus.NFS,
      };
    } else {
      return {
        status: status ?? AdoptionDtoStatus.NFS,
        petId: selectedPet.petId,
      };
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogTitle>
          {pet ? (
            <div className="pl-2">{pet?.name}의 분양 정보</div>
          ) : (
            <Header
              step={step}
              setStep={setStep}
              selectedPetName={selectedPet?.name ?? ""}
              setSearchQuery={setKeyword}
              searchType={PetControllerFindAllFilterType.MY}
              allowMyPetOnly
              setSearchType={() => {}}
              className="py-0"
            />
          )}
        </DialogTitle>

        {step === CREATE_ADOPTION_MODAL_STEP.PET_SELECT ? (
          // 1단계: 펫 선택
          <div className="space-y-4">
            <SingleSelect
              type="sex"
              initialItem={tab}
              onSelect={(value) => setTab(value as "M" | "F")}
              saveASAP
            />

            <ScrollArea className="h-[400px]">
              {pets?.filter((pet) => pet.sex === tab).length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center text-sm text-gray-500">
                  <Image src="/assets/lizard.png" alt="조회된 펫 없음" width={200} height={200} />
                  조회된 펫이 없습니다.
                </div>
              ) : (
                <div className="mb-10 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {pets
                    ?.filter((pet) => pet.sex === tab)
                    .map((pet) => {
                      const disabled = adoptionData?.some(
                        (adoption) => adoption.petId === pet.petId,
                      );
                      return (
                        <PetItem
                          key={pet.petId}
                          disabled={disabled}
                          item={pet}
                          handlePetSelect={(pet) => {
                            if (disabled) {
                              toast.error("이미 분양 정보가 있습니다.");
                              return;
                            }
                            handlePetSelect(pet);
                          }}
                        />
                      );
                    })}
                  {hasNextPage && (
                    <div ref={ref} className="h-20 text-center">
                      {isFetchingNextPage && <Loading />}
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        ) : selectedPet ? (
          // 2단계: 분양 정보 입력
          <div className="space-y-4 px-2">
            {/* 펫 정보 */}
            <Card className="bg-muted p-4">
              <div className="flex items-center gap-2 font-semibold">
                {selectedPet?.name}

                <div className="text-muted-foreground text-sm font-normal">
                  | {SPECIES_KOREAN_INFO[selectedPet.species]}
                </div>
              </div>
              <div className="flex flex-col text-sm text-gray-600">
                {selectedPet.morphs && selectedPet.morphs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedPet.morphs.map((morph: string) => `#${morph}`).join(" ")}
                  </div>
                )}
                {selectedPet?.hatchingDate && (
                  <p className="text-blue-600">
                    {(() => {
                      const dt =
                        typeof selectedPet.hatchingDate === "string"
                          ? DateTime.fromISO(selectedPet.hatchingDate)
                          : DateTime.fromJSDate(selectedPet.hatchingDate);
                      return dt.isValid ? dt.toFormat("yyyy. MM. dd") : "날짜 형식 오류";
                    })()}{" "}
                  </p>
                )}
              </div>
            </Card>

            <EditAdoptionForm
              adoptionData={getAdoptionData()}
              onSubmit={onSuccess}
              onCancel={handleClose}
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <div className="text-muted-foreground text-center text-sm">
              분양할 펫을 다시 선택해주세요.
            </div>
            <Button onClick={() => setStep(CREATE_ADOPTION_MODAL_STEP.PET_SELECT)}>
              펫 선택하러 가기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAdoptionModal;
