"use client";

import { useState, useEffect, useRef } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  petControllerFindAll,
  PetControllerFindAllFilterType,
  PetDtoSex,
  PetDtoSpecies,
} from "@repo/api-client";
import SelectStep from "./SelectStep";
import LinkStep from "./LinkStep";
import Header from "./Header";
import { useInView } from "react-intersection-observer";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";

interface ParentSearchProps {
  species?: PetDtoSpecies;
  isOpen: boolean;
  onlySelect?: boolean;
  onClose: () => void;
  onSelect: (item: PetParentDtoWithMessage) => void;
  onExit: () => void;
  sex?: PetDtoSex;
  petListType?: PetControllerFindAllFilterType;
}

const ParentSearchSelector = ({
  species,
  isOpen,
  onlySelect = false,
  onClose,
  onSelect,
  onExit,
  sex = "F",
  petListType = PetControllerFindAllFilterType.ALL,
}: ParentSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<PetParentDtoWithMessage | null>(null);
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
        filterType: petListType,
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
    staleTime: 5 * 60 * 1000, // 5분 동안 데이터를 'fresh'하게 유지
    select: (data) =>
      data.pages.flatMap((page) => page.data.data).filter((pet) => pet.sex?.toString() === sex),
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
    <BottomSheet isOpen={isOpen} onClose={onClose} fullWidth>
      <div className="flex h-[90vh] flex-col">
        <Header
          step={step}
          setStep={setStep}
          selectedPet={selectedPet ?? ({} as PetParentDtoWithMessage)}
          setSearchQuery={setSearchQuery}
        />
        <div ref={contentRef} className="relative flex-1">
          {step === 1 ? (
            <SelectStep
              pets={data as PetParentDtoWithMessage[]}
              handlePetSelect={handlePetSelect}
              hasMore={hasNextPage}
              isFetchingMore={isFetchingNextPage}
              loaderRefAction={ref}
              petListType={petListType}
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
    </BottomSheet>
  );
};

export default ParentSearchSelector;
