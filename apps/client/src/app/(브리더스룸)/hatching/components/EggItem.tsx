import {
  brMatingControllerFindAll,
  petControllerDeletePet,
  petControllerUpdate,
  PetSummaryLayingDto,
  UpdatePetDto,
  UpdatePetDtoEggStatus,
} from "@repo/api-client";
import { CheckSquare, Edit, Egg, Thermometer, Trash2 } from "lucide-react";
import DropdownMenuIcon from "./DropdownMenuIcon";
import ConfirmDialog from "../../components/Form/Dialog";
import { overlay } from "overlay-kit";
import CompleteHatchingModal from "./CompleteHatchingModal";
import EditEggModal from "./EditEggModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { AxiosError } from "axios";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { memo } from "react";
import { cn } from "@/lib/utils";

interface EggItemProps {
  pet: PetSummaryLayingDto;
  layingDate: string;
}

const EggItem = ({ pet, layingDate }: EggItemProps) => {
  const queryClient = useQueryClient();
  const isHatched = !!pet.hatchingDate;

  const { mutateAsync: updateEggStatus } = useMutation({
    mutationFn: (data: UpdatePetDto) => petControllerUpdate(pet.petId, data),
  });

  const { mutateAsync: deleteEgg } = useMutation({
    mutationFn: petControllerDeletePet,
  });

  const handleDeleteEgg = async (eggId: string, onClose: () => void) => {
    try {
      await deleteEgg(eggId);
      queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "개체 삭제에 실패했습니다.");
      } else {
        toast.error("개체 삭제에 실패했습니다.");
      }
    } finally {
      onClose();
    }
  };

  const handleDeleteEggClick = (e: React.MouseEvent, eggId: string) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close, unmount }) => (
      <ConfirmDialog
        isOpen={isOpen}
        onCloseAction={close}
        onConfirmAction={() => handleDeleteEgg(eggId, close)}
        onExit={unmount}
        title="개체 삭제 안내"
        description={`정말로 삭제하시겠습니까? \n 삭제 후 복구할 수 없습니다.`}
      />
    ));
  };

  const handleEditEggClick = (e: React.MouseEvent, egg: PetSummaryLayingDto) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => <EditEggModal isOpen={isOpen} onClose={close} egg={egg} />);
  };

  const handleHatching = (e: React.MouseEvent, petId: string, layingDate: string) => {
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <CompleteHatchingModal
        isOpen={isOpen}
        onClose={close}
        petId={petId}
        layingDate={layingDate}
      />
    ));
  };

  return (
    <div
      key={pet.petId}
      className="flex flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
    >
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1">
          {isHatched ? (
            <CheckSquare className="h-3 w-3 text-green-600" />
          ) : (
            <Egg className="h-3 w-3" />
          )}
          <div className="flex flex-col">
            <span className="text-[14px] font-[600] text-gray-700 dark:text-gray-200">
              {pet?.name ?? `${pet.clutch ?? "@"}차-${pet.clutchOrder ?? "@"}`}
            </span>
          </div>
        </div>

        {!pet.hatchingDate && (
          <div className="flex items-center">
            <div className="flex items-center gap-1 text-[12px] text-blue-600">
              <Thermometer className="h-3 w-3" />
              <span>{pet.temperature}°C</span>
            </div>
            <DropdownMenuIcon
              selectedId={pet.petId}
              menuItems={[
                {
                  icon: <CheckSquare className="h-4 w-4 text-green-600" />,
                  label: "해칭 완료",
                  onClick: (e) => handleHatching(e, pet.petId, layingDate),
                },
                {
                  icon: <Edit className="h-4 w-4 text-blue-600" />,
                  label: "수정",
                  onClick: (e) => handleEditEggClick(e, pet),
                },
                {
                  icon: <Trash2 className="h-4 w-4 text-red-600" />,
                  label: "삭제",
                  onClick: (e) => handleDeleteEggClick(e, pet.petId),
                },
              ]}
            />
          </div>
        )}
      </div>

      {!isHatched ? (
        <div className="flex items-center">
          {pet.temperature && (
            <div className="flex flex-col gap-1 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1" data-stop-link="true">
                <Select
                  value={pet.eggStatus}
                  onValueChange={async (value: UpdatePetDtoEggStatus) => {
                    await updateEggStatus({ eggStatus: value });
                    toast.success("상태가 변경되었습니다.");
                    queryClient.invalidateQueries({ queryKey: [brMatingControllerFindAll.name] });
                  }}
                >
                  <SelectTrigger
                    size="sm"
                    className={cn(
                      "flex cursor-pointer items-center gap-0.5 rounded-lg border-none px-2 text-[12px] font-[500]",
                      pet.eggStatus === "FERTILIZED"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-gray-100 text-gray-800",
                    )}
                  >
                    <SelectValue placeholder="알 상태" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem className="rounded-xl" value="FERTILIZED">
                      유정란
                    </SelectItem>
                    <SelectItem className="rounded-xl" value="UNFERTILIZED">
                      무정란
                    </SelectItem>
                    <SelectItem className="rounded-xl" value="DEAD">
                      중지
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-[12px] text-gray-600 dark:text-green-200">
          {pet.hatchingDate ? format(parseISO(pet.hatchingDate), "MM월 dd일") : ""}에 해칭
          완료되었습니다.
        </div>
      )}
    </div>
  );
};

export default memo(EggItem);
