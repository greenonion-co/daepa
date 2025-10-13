import {
  brMatingControllerFindAll,
  layingControllerUpdate,
  MatingByDateDto,
  PetSummaryLayingDto,
} from "@repo/api-client";
import { ChevronDown, ChevronUp, Plus, Edit, Trash2 } from "lucide-react";
import { overlay } from "overlay-kit";
import { useMemo, useState } from "react";
import CreateLayingModal from "./CreateLayingModal";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import CalendarSelect from "./CalendarSelect";
import { isAfter, isBefore } from "date-fns";
import DropdownMenuIcon from "./DropdownMenuIcon";

import EggItem from "./EggItem";
import { AxiosError } from "axios";
import { toast } from "sonner";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryLayingDto;
  mother?: PetSummaryLayingDto;
  matingDates: string[];
}

const MatingItem = ({ mating, father, mother, matingDates }: MatingItemProps) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const layingDates = useMemo(
    () => mating.layingsByDate?.map((laying) => laying.layingDate) ?? [],
    [mating.layingsByDate],
  );

  const { mutateAsync: updateLayingDate } = useMutation({
    mutationFn: ({ id, newLayingDate }: { id: number; newLayingDate: string }) =>
      layingControllerUpdate(id, { layingDate: newLayingDate }),
  });

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

  const getDisabledDates = (currentLayingDate: string) => {
    const convertedLayingDates = layingDates.map((date) => new Date(date));
    const sortedLayingDates = [...convertedLayingDates].sort((a, b) => a.getTime() - b.getTime());
    const currentIndex = sortedLayingDates.findIndex(
      (date) => new Date(date).getTime() === new Date(currentLayingDate).getTime(),
    );

    let prevLayingDate: Date | null = null;
    let nextLayingDate: Date | null = null;

    if (currentIndex > 0) {
      prevLayingDate = sortedLayingDates[currentIndex - 1] || null;
    }

    if (currentIndex < sortedLayingDates.length - 1) {
      nextLayingDate = sortedLayingDates[currentIndex + 1] || null;
    }

    return (date: Date) => {
      // 이전 산란일이 있는 경우, 이전 산란일 이전 날짜들은 비활성화
      if (prevLayingDate && isBefore(date, prevLayingDate)) {
        return true;
      }

      // 이후 산란일이 있는 경우, 이후 산란일 이후 날짜들은 비활성화
      if (nextLayingDate && isAfter(date, nextLayingDate)) {
        return true;
      }

      // 현재 산란일 자체는 비활성화
      if (date.getTime() === new Date(currentLayingDate).getTime()) {
        return true;
      }

      return false;
    };
  };
  const handleUpdateLayingDate = async (layingId: number, newLayingDate: string) => {
    try {
      await updateLayingDate({
        id: layingId,
        newLayingDate,
      });
      toast.success("산란일 수정에 성공했습니다.");
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "산란일 수정에 실패했습니다.");
      } else {
        toast.error("산란일 수정에 실패했습니다.");
      }
    }
  };

  return (
    <div
      key={mating.id}
      className="flex flex-col rounded-lg border-2 border-gray-200 px-2 py-3 shadow-md dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex flex-1 cursor-pointer items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-bold">
            {mating.matingDate}{" "}
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400">메이팅</span>
          </span>

          <div className="flex items-center">
            {mating.layingsByDate && mating.layingsByDate.length > 0 && (
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                {mating.layingsByDate?.length}차
              </span>
            )}

            {!isExpanded ? (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            )}

            <DropdownMenuIcon
              selectedId={mating.id}
              menuItems={[
                {
                  icon: <Edit className="h-4 w-4 text-blue-600" />,
                  label: "수정",
                  onClick: handleEditClick,
                },
                {
                  icon: <Trash2 className="h-4 w-4 text-red-600" />,
                  label: "삭제",
                  onClick: handleDeleteClick,
                },
              ]}
            />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-2">
          {mating.layingsByDate && mating.layingsByDate.length > 0 ? (
            mating.layingsByDate.map(({ layingDate, layings, layingId }) => (
              <div key={layingDate} className="border-gray-200 py-2">
                <CalendarSelect
                  disabledDates={layingDates}
                  triggerText={layingDate}
                  confirmButtonText="산란 날짜 추가"
                  onConfirm={(newLayingDate) => handleUpdateLayingDate(layingId, newLayingDate)}
                  disabled={getDisabledDates(layingDate)}
                />

                <div className="mt-2 grid gap-1">
                  {layings.map((pet) => (
                    <EggItem key={pet.petId} pet={pet} layingDate={layingDate} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">아직 산란 정보가 없습니다.</div>
          )}

          <button
            onClick={handleAddLayingClick}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-blue-100 p-2 text-sm font-bold text-blue-800 shadow-sm transition-colors hover:bg-blue-200 hover:shadow-md dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            <Plus className="h-4 w-4" />
            산란 날짜 추가
          </button>
        </div>
      )}
    </div>
  );
};

export default MatingItem;
