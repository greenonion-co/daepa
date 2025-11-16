import { useMatingFilterStore } from "../../../store/matingFilter";
import { PetDtoSex } from "@repo/api-client";
import CalendarInput from "../CalendarInput";
import { overlay } from "overlay-kit";
import ParentSearchSelector from "../../../components/selector/parentSearch";
import FilterItem from "./FilterItem";
import { format } from "date-fns";
import SingleSelect from "@/app/(브리더스룸)/components/SingleSelect";

const Filters = () => {
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
    setEggStatus,
    setStartDate,
    setEndDate,
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
            setFather(item);
          } else {
            setMother(item);
          }
        }}
        sex={sex}
        onExit={unmount}
        onlySelect
        species={species ?? undefined}
      />
    ));

  return (
    <div className="mb-4 mt-2 flex flex-wrap items-center gap-2">
      <SingleSelect
        showTitle
        type="species"
        initialItem={species}
        onSelect={(item) => {
          const changed = species !== item;
          setSpecies(item);
          if (!item || changed) {
            setFather(null);
            setMother(null);
          }
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
          <SingleSelect
            showTitle
            type="eggStatus"
            initialItem={eggStatus}
            onSelect={(item) => setEggStatus(item)}
          />
        </>
      )}

      <CalendarInput
        placeholder="시작일"
        value={startDate}
        onSelect={(date) => {
          if (!date) return;
          setStartDate(format(date, "yyyy-MM-dd"));
        }}
      />

      <CalendarInput
        placeholder="종료일"
        value={endDate}
        onSelect={(date) => {
          if (!date) return;
          setEndDate(format(date, "yyyy-MM-dd"));
        }}
      />

      {(eggStatus || species || father || mother || startDate || endDate) && (
        <button
          type="button"
          onClick={reset}
          className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-blue-700 underline hover:bg-blue-100"
        >
          필터 리셋
        </button>
      )}
    </div>
  );
};

export default Filters;
