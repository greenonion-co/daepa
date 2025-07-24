import { formatDateToYYYYMMDDString, getNumberToDate } from "@/lib/utils";
import {
  eggControllerDelete,
  eggControllerHatched,
  eggControllerUpdateLayingDate,
  LayingDto,
  MatingByDateDto,
  matingControllerFindAll,
  PetSummaryDto,
} from "@repo/api-client";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Egg,
  Thermometer,
  Edit,
  Trash2,
  CheckSquare,
} from "lucide-react";
import { overlay } from "overlay-kit";
import { useMemo, useState } from "react";
import CreateLayingModal from "./CreateLayingModal";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";
import Link from "next/link";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import CalendarSelect from "./CalendarSelect";
import { isAfter, isBefore } from "date-fns";
import DropdownMenuIcon from "./DropdownMenuIcon";
import Dialog from "../../components/Form/Dialog";
import { toast } from "sonner";
import { AxiosError } from "axios";
import EditEggModal from "./EditEggModal";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
  matingDates: Date[];
}

const MatingItem = ({ mating, father, mother, matingDates }: MatingItemProps) => {
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const layingDates = useMemo(
    () => mating.layingsByDate?.map((laying) => getNumberToDate(laying.layingDate)) ?? [],
    [mating.layingsByDate],
  );

  const { mutate: updateLayingDate } = useMutation({
    mutationFn: eggControllerUpdateLayingDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
    },
  });

  const { mutate: deleteEgg } = useMutation({
    mutationFn: eggControllerDelete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
    },
  });

  const { mutate: mutateHatched } = useMutation({
    mutationFn: eggControllerHatched,
    onSuccess: (response) => {
      if (response?.data?.hatchedPetId) {
        toast.success("해칭 완료");
        queryClient.invalidateQueries({ queryKey: [matingControllerFindAll.name] });
      }
    },
    onError: (error: AxiosError<{ message: string }>) => {
      console.error("Failed to hatch egg:", error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("펫 등록에 실패했습니다.");
      }
    },
  });

  const handleAddLayingClick = () => {
    overlay.open(({ isOpen, close }) => (
      <CreateLayingModal
        isOpen={isOpen}
        onClose={close}
        matingId={mating.id}
        father={father}
        mother={mother}
        layingData={mating.layingsByDate}
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
          matingDate: mating.matingDate,
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
        matingDate={formatDateToYYYYMMDDString(mating.matingDate, "yy/MM/dd")}
      />
    ));
  };

  const handleEditEggClick = (e: React.MouseEvent, egg: LayingDto) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => <EditEggModal isOpen={isOpen} onClose={close} egg={egg} />);
  };

  const getDisabledDates = (currentLayingDate: Date) => {
    const sortedLayingDates = [...layingDates].sort((a, b) => a.getTime() - b.getTime());
    const currentIndex = sortedLayingDates.findIndex(
      (date) => date.getTime() === currentLayingDate.getTime(),
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
      if (date.getTime() === currentLayingDate.getTime()) {
        return true;
      }

      return false;
    };
  };

  const handleDeleteEggClick = (e: React.MouseEvent, eggId: string) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          deleteEgg(eggId);
          close();
        }}
        onExit={unmount}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleHatching = (e: React.MouseEvent, eggId: string) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close, unmount }) => (
      <Dialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => {
          mutateHatched(eggId);
          close();
        }}
        onExit={unmount}
        title="해칭 안내"
        description={`정말로 해칭 완료하시겠습니까? \n 해칭 후 복구할 수 없습니다.`}
      />
    ));
  };

  return (
    <div
      key={mating.id}
      className="flex flex-col rounded-lg border-2 border-gray-200 px-2 py-3 shadow-md"
    >
      <div className="flex items-center justify-between">
        <div
          className="flex flex-1 cursor-pointer items-center justify-between"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="font-bold">
            {formatDateToYYYYMMDDString(mating.matingDate, "yy/MM/dd")}{" "}
            <span className="text-sm font-normal text-gray-500">메이팅</span>
          </span>

          <div className="flex items-center">
            {mating.layingsByDate && mating.layingsByDate.length > 0 && (
              <span className="text-sm font-semibold text-gray-500">
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
            mating.layingsByDate.map(({ layingDate, layings }) => (
              <div key={layingDate} className="border-gray-200 py-2">
                <CalendarSelect
                  disabledDates={layingDates}
                  triggerText={formatDateToYYYYMMDDString(layingDate, "MM/dd")}
                  confirmButtonText="산란 추가"
                  onConfirm={(newLayingDate) => {
                    const matingDateNumber = parseInt(newLayingDate.replace(/-/g, ""), 10);

                    updateLayingDate({
                      matingId: mating.id,
                      currentLayingDate: layingDate,
                      newLayingDate: matingDateNumber,
                    });
                  }}
                  disabled={getDisabledDates(getNumberToDate(layingDate))}
                />

                <div className="mt-2 grid gap-1">
                  {layings.map((laying) => (
                    <Link
                      key={laying.eggId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-3 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md"
                      href={`/egg/${laying.eggId}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                          <Egg className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {laying.clutch ?? "@"}-{laying.clutchOrder}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center">
                        {laying.temperature && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Thermometer className="h-3 w-3" />
                            <span>{laying.temperature}°C</span>
                          </div>
                        )}
                        <DropdownMenuIcon
                          selectedId={laying.eggId}
                          menuItems={[
                            {
                              icon: <CheckSquare className="h-4 w-4 text-green-600" />,
                              label: "해칭 완료",
                              onClick: (e) => handleHatching(e, laying.eggId),
                            },
                            {
                              icon: <Edit className="h-4 w-4 text-blue-600" />,
                              label: "수정",
                              onClick: (e) => handleEditEggClick(e, laying),
                            },
                            {
                              icon: <Trash2 className="h-4 w-4 text-red-600" />,
                              label: "삭제",
                              onClick: (e) => handleDeleteEggClick(e, laying.eggId),
                            },
                          ]}
                        />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500">아직 산란 정보가 없습니다.</div>
          )}

          <button
            onClick={handleAddLayingClick}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 p-2 text-sm font-bold text-blue-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            산란 추가
          </button>
        </div>
      )}
    </div>
  );
};

export default MatingItem;
