import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import EditActionButtons from "./EditActionButtons";
import {
  petImageControllerFindOne,
  PetImageItem,
  petImageControllerSavePetImages,
  PetDto,
} from "@repo/api-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { isEqual } from "es-toolkit";
import { ImageUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useIsMyPet } from "@/hooks/useIsMyPet";

const Images = ({ pet }: { pet: PetDto }) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // 편집 중일 때만 임시 상태 사용 (null이면 photos 사용)
  const [editingImages, setEditingImages] = useState<PetImageItem[] | null>(null);
  const ownerId = pet.owner.userId ?? "";

  const isViewingMyPet = useIsMyPet(ownerId);

  const {
    data: photos = [],
    isSuccess,
    refetch,
  } = useQuery({
    queryKey: [petImageControllerFindOne.name, pet.petId],
    queryFn: () => petImageControllerFindOne(pet.petId),
    select: (response) => response.data,
  });

  // 현재 표시할 이미지 (편집 중이면 editingImages, 아니면 photos)
  const displayImages = editingImages ?? photos;

  const { mutateAsync: mutateSaveImages } = useMutation({
    mutationFn: (updateFiles: PetImageItem[]) =>
      petImageControllerSavePetImages(pet.petId, { files: updateFiles }),
  });

  const handleSave = useCallback(async () => {
    try {
      setIsProcessing(true);

      // fileName만 비교하여 변경 여부 확인
      const originalFileNames = photos.map((p) => p.fileName);
      const currentFileNames = displayImages.map((p) => p.fileName);

      if (isEqual(originalFileNames, currentFileNames)) {
        toast.info("변경된 사항이 없습니다.");
        setEditingImages(null);
        setIsEditMode(false);
        return;
      }

      await mutateSaveImages(displayImages);
      await refetch();

      toast.success("이미지 수정이 완료되었습니다.");
      setEditingImages(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("이미지 수정 실패:", error);
      toast.error("이미지 수정에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, [mutateSaveImages, displayImages, photos, refetch]);

  // 최근 본 펫을 localStorage에 저장
  useEffect(() => {
    if (!pet || !isSuccess) return;

    const STORAGE_KEY = "recently_viewed_pets";
    const MAX_ITEMS = 20;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const currentList = stored ? JSON.parse(stored) : [];

      // 현재 펫 정보
      const newItem = {
        petId: pet.petId,
        name: pet.name,
        species: pet.species,
        photoUrl: photos[0]?.url,
        morphs: pet.morphs,
        hatchingDate: pet.hatchingDate,
      };

      // 중복 제거 (같은 petId가 있으면 제거)
      const filteredList = currentList.filter(
        (item: { petId: string }) => item.petId !== pet.petId,
      );

      // 새 항목을 맨 앞에 추가
      const updatedList = [newItem, ...filteredList].slice(0, MAX_ITEMS);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));

      // 커스텀 이벤트 발생시켜서 다른 컴포넌트에 알림
      window.dispatchEvent(new Event("recentlyViewedUpdated"));
    } catch (error) {
      console.error("Failed to save recently viewed pet:", error);
    }
  }, [pet, isSuccess, photos]);

  return (
    <div className="shadow-xs flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">이미지</div>

      {!isEditMode && photos.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center">
          <ImageUp className="h-[10%] w-[10%] text-blue-500/70" />
        </div>
      )}
      <DndImagePicker disabled={!isEditMode} images={displayImages} onChange={setEditingImages} />

      <EditActionButtons
        isVisible={isViewingMyPet}
        isEditMode={isEditMode}
        isProcessing={isProcessing}
        onCancel={() => {
          setEditingImages(null);
          setIsEditMode(false);
        }}
        onSubmit={async () => {
          if (isEditMode) {
            await handleSave();
          } else {
            setEditingImages([...photos]);
            setIsEditMode(true);
          }
        }}
        defaultLabel={photos.length === 0 ? "이미지 등록" : "이미지 수정"}
      />
    </div>
  );
};

export default Images;
