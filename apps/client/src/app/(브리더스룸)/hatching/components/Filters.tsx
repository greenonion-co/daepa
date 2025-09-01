import { Button } from "@/components/ui/button";
import { useSelect } from "../../register/hooks/useSelect";
import { useMatingFilterStore } from "../../store/matingFilter";
import { SPECIES_KOREAN_INFO } from "../../constants";
import { BrPetControllerFindAllFilterType, PetDtoSex, PetDtoSpecies } from "@repo/api-client";
import CalendarInput from "./CalendarInput";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../components/selector/parentSearch";
import { ChevronDown, X } from "lucide-react";

const Filters = () => {
  const { handleSelect } = useSelect();
  const {
    species,
    father,
    mother,
    startDate,
    endDate,
    setSpecies,
    setFather,
    setMother,
    setStartDate,
    setEndDate,
  } = useMatingFilterStore();

  const openParentSearchSelector = (sex: PetDtoSex) =>
    overlay.open(({ isOpen, close, unmount }) => (
      <ParentSearchSelector
        isOpen={isOpen}
        onClose={close}
        onSelect={(item) => {
          close();
          if (sex === PetDtoSex.MALE) {
            setFather(item);
          } else {
            setMother(item);
          }
        }}
        sex={sex}
        onExit={unmount}
        petListType={BrPetControllerFindAllFilterType.MY}
        onlySelect
      />
    ));

  return (
    <>
      {/* 필터 바 */}
      <div className="m-2 flex flex-col gap-2 px-2 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <div
            className="mb-2 flex items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]"
            onClick={() =>
              handleSelect({
                type: "species",
                value: species ?? "",
                handleNext: ({ value }) => setSpecies(value as PetDtoSpecies),
              })
            }
          >
            {species ? SPECIES_KOREAN_INFO[species] : "종 선택"}
          </div>

          <div
            className="mb-2 flex items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]"
            onClick={(e) => {
              e.stopPropagation();
              if (father) {
                setFather(null);
              } else {
                openParentSearchSelector(PetDtoSex.MALE);
              }
            }}
          >
            {father?.name ?? "부 선택"}
            {father ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
          <div
            className="mb-2 flex items-center gap-2 rounded-full border-2 border-[#1A56B3] pb-1 pl-3 pr-3 pt-1 text-[14px] font-semibold text-[#1A56B3]"
            onClick={(e) => {
              e.stopPropagation();
              if (mother) {
                setMother(null);
              } else {
                openParentSearchSelector(PetDtoSex.FEMALE);
              }
            }}
          >
            {mother?.name ?? "모 선택"}
            {mother ? <X className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>

        <div className="flex w-full items-center gap-2">
          <CalendarInput
            placeholder="시작일"
            value={startDate}
            onSelect={(date) => setStartDate(date)}
          />
          <span className="text-sm text-gray-500">-</span>
          <CalendarInput
            placeholder="종료일"
            value={endDate}
            onSelect={(date) => setEndDate(date)}
          />

          {(species || father || mother || startDate || endDate) && (
            <Button
              variant="outline"
              onClick={() => {
                // 초기화
              }}
              className="h-9"
            >
              초기화
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default Filters;
