import { MatingByDateDto, PetSummaryLayingDto } from "@repo/api-client";
import { Trash2, NotebookPen } from "lucide-react";
import { overlay } from "overlay-kit";
import { memo, useMemo, useState } from "react";
import CreateLayingModal from "./CreateLayingModal";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";

import LayingItem from "./LayingItem";
import { format } from "date-fns";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
  matingDates: string[];
}

const MatingItem = ({ mating, father, mother, matingDates }: MatingItemProps) => {
  const [closeAllTick, setCloseAllTick] = useState(0);
  const layingDates = useMemo(
    () => mating.layingsByDate?.map((laying) => laying.layingDate) ?? [],
    [mating.layingsByDate],
  );

  const handleAddLayingClick = () => {
    overlay.open(({ isOpen, close }) => (
      <CreateLayingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        matingDate={mating.matingDate}
        layingData={mating.layingsByDate}
        fatherId={father?.petId}
        motherId={mother?.petId}
      />
    ));
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <EditMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        currentData={{
          fatherId: father?.petId,
          motherId: mother?.petId,
          matingDate: mating.matingDate ?? "",
        }}
        matingDates={matingDates}
      />
    ));
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <DeleteMatingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        matingDate={mating.matingDate}
      />
    ));
  };

  const handleCloseAllLayings = () => {
    setCloseAllTick((prev) => prev + 1);
  };

  return (
    <div key={mating.id} className="flex flex-col py-2 dark:border-gray-700">
      <div className="flex items-center justify-between gap-1 px-2">
        <div className="flex items-center gap-2">
          <div className="text-[14px] font-semibold text-gray-700 dark:text-gray-200">
            {mating.matingDate
              ? format(new Date(mating.matingDate ?? ""), "yyyy년 MM월 dd일")
              : "-"}
          </div>
          <button
            type="button"
            onClick={handleAddLayingClick}
            className="rounded-lg bg-blue-100 px-2 py-1 text-[12px] font-semibold text-blue-600"
          >
            + 산란 추가
          </button>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="rounded-lg px-2 py-1 text-[12px] text-gray-500 hover:bg-gray-100"
            onClick={handleCloseAllLayings}
          >
            모두 닫기
          </button>
          <button type="button" aria-label="교배 정보 수정" onClick={handleEditClick}>
            <NotebookPen className="h-4 w-4 text-blue-600" />
          </button>
          <button type="button" aria-label="교배 정보 삭제" onClick={handleDeleteClick}>
            <Trash2 className="h-4 w-4 text-red-600" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        {mating.layingsByDate && mating.layingsByDate.length > 0 ? (
          mating.layingsByDate.map((layingData) => (
            <LayingItem
              key={layingData.layingId}
              layingDates={layingDates}
              layingData={layingData}
              matingDate={mating.matingDate}
              closeSignal={closeAllTick}
            />
          ))
        ) : (
          <div className="px-2 text-[12px] text-gray-500">아직 산란 정보가 없습니다.</div>
        )}
      </div>
    </div>
  );
};

export default memo(MatingItem);
