"use client";

import { useState, useEffect, useRef } from "react";
import BottomSheet from "@/components/common/BottomSheet";
import { useInfiniteQuery } from "@tanstack/react-query";
import { petControllerFindAll } from "@repo/api-client";
import SelectStep from "./SelectStep";
import LinkStep from "./LinkStep";
import Header from "./Header";
import { useInView } from "react-intersection-observer";
import { PetParentDtoWithMessage } from "@/app/(브리더스룸)/pet/store/parentLink";

interface ParentSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: PetParentDtoWithMessage) => void;
  onExit: () => void;
  sex?: "M" | "F";
}

const currentUserId = "ADMIN";

export default function ParentSearchSelector({
  isOpen,
  onClose,
  onSelect,
  onExit,
  sex = "F",
}: ParentSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1);
  const [selectedPet, setSelectedPet] = useState<PetParentDtoWithMessage | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [petControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      petControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "DESC",
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

  // const searchResults = data?.filter((item) =>
  //   item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  // );

  const handlePetSelect = (pet: PetParentDtoWithMessage) => {
    setSelectedPet(pet);
    setStep(2);
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} fullWidth>
      <div className="flex h-[90vh] flex-col">
        <Header
          step={step}
          setStep={setStep}
          selectedPet={selectedPet ?? ({} as PetParentDtoWithMessage)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <div ref={contentRef} className="relative flex-1">
          {step === 1 ? (
            <SelectStep
              pets={data as PetParentDtoWithMessage[]}
              currentUserId={currentUserId}
              handlePetSelect={handlePetSelect}
              hasMore={hasNextPage}
              isFetchingMore={isFetchingNextPage}
              loaderRefAction={ref}
            />
          ) : (
            <LinkStep
              selectedPet={selectedPet ?? ({} as PetParentDtoWithMessage)}
              currentUserId={currentUserId}
              onSelect={onSelect}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </BottomSheet>
  );
}
