import { useSelect } from "../../../register/hooks/useSelect";
import { useMatingFilterStore } from "../../../store/matingFilter";
import { EGG_STATUS_KOREAN_INFO, SPECIES_KOREAN_INFO } from "../../../constants";
import {
  BrPetControllerFindAllFilterType,
  CreateMatingDtoEggStatus,
  PetDtoSex,
  PetDtoSpecies,
  PetParentDto,
} from "@repo/api-client";
import CalendarInput from "../CalendarInput";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../../components/selector/parentSearch";
import FilterItem from "./FilterItem";
import { format } from "date-fns";
import { X } from "lucide-react";

const Filters = () => {
  const { handleSelect } = useSelect();
  const {
    species,
    eggStatus,
    father,
    mother,
    startDate,
    endDate,
    setSpecies,
    setFather,
    setMother,
    setStartDate,
    setEndDate,
    setEggStatus,
    reset,
  } = useMatingFilterStore();

  const openParentSearchSelector = (sex: PetDtoSex) =>
    overlay.open(({ isOpen, close, unmount }) => (
      <ParentSearchSelector
        isOpen={isOpen}
        onClose={close}
        onSelect={(item) => {
          close();
          if (sex === PetDtoSex.MALE) {
            setFather(item as PetParentDto);
          } else {
            setMother(item as PetParentDto);
          }
        }}
        sex={sex}
        onExit={unmount}
        petListType={BrPetControllerFindAllFilterType.MY}
        onlySelect
        species={species ?? undefined}
      />
    ));

  return (
    <div className="flex w-full items-center gap-2 overflow-x-auto overflow-y-hidden whitespace-nowrap p-2">
      <FilterItem
        value={eggStatus ? EGG_STATUS_KOREAN_INFO[eggStatus] : undefined}
        placeholder="알 상태"
        onClick={() => {
          handleSelect({
            type: "eggStatus",
            value: eggStatus ?? "",
            handleNext: ({ value }) => {
              setEggStatus(value as CreateMatingDtoEggStatus);
            },
          });
        }}
        onClose={() => {
          setEggStatus(null);
        }}
      />
      <FilterItem
        value={species ? SPECIES_KOREAN_INFO[species] : undefined}
        placeholder="종"
        onClose={() => {
          setSpecies(null);
          setFather(null);
          setMother(null);
        }}
        onClick={() => {
          handleSelect({
            type: "species",
            value: species ?? "",
            handleNext: ({ value }) => setSpecies(value as PetDtoSpecies),
          });
        }}
      />
      {species && (
        <>
          <FilterItem
            value={father?.name}
            placeholder="부 선택"
            onClose={() => {
              setFather(null);
            }}
            onClick={() => {
              openParentSearchSelector(PetDtoSex.MALE);
            }}
          />
          <FilterItem
            value={mother?.name}
            placeholder="모 선택"
            onClose={() => {
              setMother(null);
            }}
            onClick={() => {
              openParentSearchSelector(PetDtoSex.FEMALE);
            }}
          />
        </>
      )}

      <div className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]">
        <CalendarInput
          placeholder="시작일"
          value={startDate}
          onSelect={(date) => {
            if (!date) return;
            setStartDate(format(date, "yyyy-MM-dd"));
          }}
        />
        {startDate && <X className="h-4 w-4" onClick={() => setStartDate(undefined)} />}
      </div>
      <div className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]">
        <CalendarInput
          placeholder="종료일"
          value={endDate}
          onSelect={(date) => {
            if (!date) return;
            setEndDate(format(date, "yyyy-MM-dd"));
          }}
        />
        {endDate && <X className="h-4 w-4" onClick={() => setEndDate(undefined)} />}
      </div>

      {(species || father || mother || startDate || endDate) && (
        <div
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-full border-2 border-red-500 bg-red-500/10 pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-red-500"
          onClick={reset}
        >
          필터 초기화
        </div>
      )}
    </div>
  );
};

export default Filters;
