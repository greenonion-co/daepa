import { formatDateToYYYYMMDDString } from "@/lib/utils";
import { MatingByDateDto, PetSummaryDto } from "@repo/api-client";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Egg,
  Thermometer,
  Edit,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { overlay } from "overlay-kit";
import { useState } from "react";
import CreateLayingModal from "./CreateLayingModal";
import EditMatingModal from "./EditMatingModal";
import DeleteMatingModal from "./DeleteMatingModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MatingItemProps {
  mating: MatingByDateDto;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
  matingDates: Date[];
}

const MatingItem = ({ mating, father, mother, matingDates }: MatingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

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

  return (
    <div
      key={mating.id}
      className="flex flex-col rounded-lg border-2 border-gray-200 py-3 pl-3 pr-1 shadow-md hover:bg-gray-100"
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-4 w-4 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* <DropdownMenuLabel>Actions</DropdownMenuLabel> */}
                <DropdownMenuItem onClick={handleEditClick}>
                  <Edit className="h-4 w-4 text-blue-600" />
                  <span>수정</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteClick}>
                  <Trash2 className="h-4 w-4 text-red-600" />
                  <span>삭제</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div>
          {mating.layingsByDate && mating.layingsByDate.length > 0 ? (
            mating.layingsByDate.map(({ layingDate, layings }) => (
              <div key={layingDate} className="mb-4">
                <div className="mb-2 text-sm font-medium text-gray-600">
                  {formatDateToYYYYMMDDString(layingDate, "MM/dd")} 산란일
                </div>
                <div className="grid gap-2">
                  {layings.map((laying) => (
                    <Link
                      key={laying.eggId}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
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
                      <div className="flex items-center gap-2">
                        {laying.temperature && (
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Thermometer className="h-3 w-3" />
                            <span>{laying.temperature}°C</span>
                          </div>
                        )}
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
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-100 p-2 text-sm font-bold text-blue-800 transition-colors hover:bg-blue-200"
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
