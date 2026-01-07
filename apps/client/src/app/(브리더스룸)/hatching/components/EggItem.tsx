"use client";

import {
  PetSummaryLayingDto,
  PetSummaryLayingDtoEggStatus,
  UpdatePetDtoEggStatus,
} from "@repo/api-client";
import { Edit, Trash2 } from "lucide-react";
import DropdownMenuIcon from "./DropdownMenuIcon";
import { DateTime } from "luxon";
import { memo } from "react";
import { cn } from "@/lib/utils";
import { GENDER_KOREAN_INFO } from "../../constants";
import { useRouter } from "next/navigation";
import Select from "./Select";
import { useIsMobile } from "@/hooks/useMobile";
import { TUTORIAL_TARGETS } from "./MatingDetailDialogTutorial";

interface EggItemProps {
  pet: PetSummaryLayingDto;
  layingDate: string;
  handleHatching: (e: React.MouseEvent) => void;
  handleDeleteEggClick: (e: React.MouseEvent) => void;
  handleEditEggClick: (e: React.MouseEvent) => void;
  handleUpdate: (value: UpdatePetDtoEggStatus) => Promise<void>;
  showTutorial?: boolean;
}

const EggItem = ({
  pet,
  layingDate,
  handleHatching,
  handleDeleteEggClick,
  handleEditEggClick,
  handleUpdate,
  showTutorial,
}: EggItemProps) => {
  const router = useRouter();
  const isMobile = useIsMobile();
  const isHatched = !!pet.hatchingDate;

  const getExpectedDate = (temperature = 25) => {
    // 온도 기반 해칭일 계산 (기본 25°C)
    const incubationDay = 60 - (temperature - 25) * 10;
    const expectedDate = DateTime.fromFormat(layingDate, "yyyy-MM-dd").plus({
      days: incubationDay,
    });

    return expectedDate.setLocale("ko").toFormat("M월 d일(ccc)");
  };

  return (
    <div
      key={pet.petId}
      className={cn(
        "flex w-full items-center justify-between p-1 pl-0 text-[14px] hover:rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800",
        isHatched && "cursor-pointer",
      )}
      onClick={() => {
        if (isHatched) {
          router.push(`/pet/${pet.petId}`);
        }
      }}
    >
      <div className="flex">
        <div
          className={cn(
            "flex w-[56px] items-center justify-center font-semibold text-gray-500 dark:text-gray-400",
            isMobile && "w-[30px]",
          )}
        />

        <div className="flex flex-col px-1 py-1.5">
          <div className="flex items-center gap-1 font-semibold">
            <div className="text-gray-800 dark:text-gray-200">
              {pet?.name ?? `${pet.clutch ?? "@"}차-${pet.clutchOrder ?? "@"}`}
            </div>
            {pet.temperature && (
              <span className="text-[12px] font-[500] text-gray-600 dark:text-gray-400">| {pet.temperature}℃</span>
            )}

            {pet.sex && (
              <span className="text-[12px] font-[500] text-gray-600 dark:text-gray-400">
                | {GENDER_KOREAN_INFO[pet.sex]}
              </span>
            )}
          </div>
          {!isHatched && pet.eggStatus === PetSummaryLayingDtoEggStatus.FERTILIZED && (
            <div className="text-xs font-[500] text-blue-600 dark:text-blue-400">
              <span className="font-[400]">예상 해칭일: </span>
              {getExpectedDate(pet.temperature)}
            </div>
          )}
        </div>
      </div>

      {!isHatched ? (
        <div className="flex">
          <Select
            value={pet.eggStatus}
            handleValueChange={handleUpdate}
            selectItems={{ FERTILIZED: "유정란", UNFERTILIZED: "무정란", DEAD: "중지란" }}
            triggerClassName={
              pet.eggStatus === "FERTILIZED"
                ? "bg-yellow-700/80 text-yellow-100 border-none font-[600]"
                : "font-[600] text-gray-700 dark:text-gray-300"
            }
            iconClassName={pet.eggStatus === "FERTILIZED" ? "text-white" : "text-black dark:text-white"}
          />

          {/* 수정/삭제 드롭다운 */}
          <div data-tutorial={showTutorial ? TUTORIAL_TARGETS.EGG_MENU : undefined}>
            <DropdownMenuIcon
              selectedId={pet.petId}
              menuItems={[
                {
                  icon: <Edit className="h-4 w-4 text-blue-600" />,
                  label: "해칭 완료",
                  onClick: handleHatching,
                },
                {
                  icon: <Edit className="h-4 w-4 text-blue-600" />,
                  label: "수정",
                  onClick: handleEditEggClick,
                },
                {
                  icon: <Trash2 className="h-4 w-4 text-red-600" />,
                  label: "삭제",
                  onClick: handleDeleteEggClick,
                },
              ]}
              forceOpen={showTutorial}
            />
          </div>
        </div>
      ) : (
        <div className="font-[600] text-blue-700 dark:text-blue-400">
          {pet.hatchingDate ? DateTime.fromISO(pet.hatchingDate).toFormat("M/d 해칭") : "해칭 완료"}
        </div>
      )}
    </div>
  );
};

export default memo(EggItem);
