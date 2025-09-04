import {
  brMatingControllerFindAll,
  petControllerDeletePet,
  PetSummaryWithLayingDto,
} from "@repo/api-client";
import { CheckSquare, Edit, Egg, Thermometer, Trash2 } from "lucide-react";
import Link from "next/link";
import DropdownMenuIcon from "./DropdownMenuIcon";
import ConfirmDialog from "../../components/Form/Dialog";
import { overlay } from "overlay-kit";
import CompleteHatchingModal from "./CompleteHatchingModal";
import EditEggModal from "./EditEggModal";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AxiosError } from "axios";
import { toast } from "sonner";

interface EggItemProps {
  pet: PetSummaryWithLayingDto;
  layingDate: string;
}

const EggItem = ({ pet, layingDate }: EggItemProps) => {
  const queryClient = useQueryClient();
  const isHatched = !!pet.hatchingDate;

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

  const handleEditEggClick = (e: React.MouseEvent, egg: PetSummaryWithLayingDto) => {
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
    <Link
      key={pet.petId}
      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-2 py-3 shadow-sm transition-all hover:bg-gray-100 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      href={`/pet/${pet.petId}`}
    >
      <div className="flex items-center gap-3">
        {isHatched ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 dark:text-green-200">
            <CheckSquare className="h-4 w-4 text-green-600" />
          </div>
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 dark:text-blue-200">
            <Egg className="h-4 w-4 text-blue-600" />
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-medium text-gray-900 dark:text-gray-200">
            {pet?.name ?? `${pet.clutch ?? "@"}-${pet.clutchOrder ?? "@"}`}
          </span>
        </div>
      </div>

      {!isHatched ? (
        <div className="flex items-center">
          {pet.temperature && (
            <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
              <Thermometer className="h-3 w-3" />
              <span>{pet.temperature}°C</span>
            </div>
          )}
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
      ) : (
        <Button className="bg-green-600 dark:bg-green-900 dark:text-green-200">
          {format(new Date(pet.hatchingDate ?? ""), "MM.dd")} 해칭 완료
        </Button>
      )}
    </Link>
  );
};

export default EggItem;
