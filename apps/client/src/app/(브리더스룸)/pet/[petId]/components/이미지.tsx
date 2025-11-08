import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import { usePetStore } from "@/app/(브리더스룸)/register/store/pet";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  petControllerFindPetByPetId,
  petControllerUpdate,
  PetDto,
  UpdatePetDto,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isNil, pick, pickBy } from "es-toolkit";
import { ImageUp } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

const Images = ({ pet }: { pet: PetDto }) => {
  const queryClient = useQueryClient();
  const { formData, setFormData } = usePetStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { mutateAsync: mutateUpdatePet } = useMutation({
    mutationFn: (updateData: UpdatePetDto) => petControllerUpdate(pet.petId, updateData),
  });

  const handleSave = useCallback(async () => {
    try {
      setIsProcessing(true);
      const pickedData = pick(formData, ["photos"]);
      const updateData = pickBy(pickedData, (value) => !isNil(value));
      await mutateUpdatePet(updateData);
      toast.success("이미지 수정이 완료되었습니다.");
      setIsEditMode(false);
    } catch (error) {
      console.error("이미지 수정 실패:", error);
      toast.error("이미지 수정에 실패했습니다.");
    } finally {
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: [petControllerFindPetByPetId.name, pet.petId] });
    }
  }, [mutateUpdatePet, formData, queryClient, pet.petId]);

  return (
    <div className="shadow-xs flex h-full min-w-[340px] flex-col gap-2 rounded-2xl bg-white p-3">
      <div className="text-[14px] font-[600] text-gray-600">이미지</div>

      {!isEditMode && isNil(formData.photos) && (
        <div className="flex h-full flex-col items-center justify-center">
          <ImageUp className="h-[20%] w-[20%] text-blue-500/70" />
        </div>
      )}
      <DndImagePicker disabled={!isEditMode} />

      <div className="mt-2 flex w-full flex-1 items-end gap-2">
        {isEditMode && (
          <Button
            className="h-10 flex-1 cursor-pointer rounded-lg font-bold"
            onClick={() => {
              setFormData((prev) => ({
                ...prev,
                photos: pet.photos,
              }));
              setIsEditMode(false);
            }}
          >
            취소
          </Button>
        )}
        <Button
          disabled={isProcessing}
          className={cn(
            "flex-2 h-10 cursor-pointer rounded-lg font-bold",
            isEditMode && "bg-red-600 hover:bg-red-600/90",
            isProcessing && "bg-gray-300",
          )}
          onClick={() => {
            if (isEditMode) {
              handleSave();
            } else {
              setIsEditMode(true);
            }
          }}
        >
          {isProcessing ? (
            <Loading />
          ) : !isEditMode ? (
            isNil(formData.photos) ? (
              "이미지 등록"
            ) : (
              "이미지 수정"
            )
          ) : (
            "수정된 사항 저장하기"
          )}
        </Button>
      </div>
    </div>
  );
};

export default Images;
