"use client";

import { useState, useEffect, useRef } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  petControllerFindAll,
  PetControllerFindAllFilterType as PetListType,
  PetDtoSex,
  PetDtoSpecies,
  PetDto,
} from "@repo/api-client";
import SelectStep from "./SelectStep";
import LinkStep from "./LinkStep";
import Header from "./Header";
import { useInView } from "react-intersection-observer";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useParams } from "next/navigation";

interface ParentSearchProps {
  sex?: PetDtoSex;
  species?: PetDtoSpecies;
  isOpen: boolean;
  onlySelect?: boolean;
  allowMyPetOnly?: boolean;
  onClose: () => void;
  onSelect: (item: PetDto) => void;
  onExit: () => void;
}

const ParentSearchSelector = ({
  sex = "F",
  species,
  isOpen,
  onlySelect = false,
  allowMyPetOnly = false,
  onClose,
  onSelect,
  onExit,
}: ParentSearchProps) => {
  const { petId } = useParams<{ petId: string }>();
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<PetParentDtoWithMessage | null>(null);
  const [petListType, setPetListType] = useState<PetListType>(PetListType.MY);
  const contentRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView();
  const itemPerPage = 10;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [petControllerFindAll.name, petListType, searchQuery, species],
    queryFn: ({ pageParam = 1 }) =>
      petControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
        filterType: allowMyPetOnly ? PetListType.MY : PetListType.ALL,
        keyword: searchQuery ?? "",
        species: species ?? undefined,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
    select: (data) =>
      data.pages
        .flatMap((page) => page.data.data)
        .filter((pet) => pet.petId !== petId && pet.sex?.toString() === sex),
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [step]);

  useEffect(() => {
    return () => onExit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePetSelect = (pet: PetParentDtoWithMessage) => {
    if (onlySelect) {
      onSelect(pet);
    } else {
      setSelectedPet(pet);
      setStep(2);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] rounded-3xl sm:max-w-[720px]">
        <DialogTitle className="sr-only">부모 개체 선택</DialogTitle>

        <div className="flex h-full flex-col">
          <Header
            step={step}
            searchType={petListType}
            setStep={setStep}
            selectedPetName={selectedPet?.name ?? ""}
            setSearchQuery={setSearchQuery}
            setSearchType={setPetListType}
            allowMyPetOnly={allowMyPetOnly}
          />
          <div ref={contentRef} className="relative flex-1">
            {step === 1 ? (
              <SelectStep
                pets={data as PetParentDtoWithMessage[]}
                handlePetSelect={handlePetSelect}
                hasMore={hasNextPage}
                isFetchingMore={isFetchingNextPage}
                loaderRefAction={ref}
                searchType={petListType}
              />
            ) : (
              <LinkStep
                selectedPet={selectedPet ?? ({} as PetParentDtoWithMessage)}
                onSelect={onSelect}
                onClose={onClose}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParentSearchSelector;
