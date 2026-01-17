"use client";

import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import EditActionButtons from "./EditActionButtons";
import {
  petImageControllerFindOne,
  PetImageItem,
  petImageControllerSavePetImages,
  PetDto,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { isEqual } from "es-toolkit";
import { toast } from "@/lib/toast";
import { useCallback, useMemo, useState } from "react";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { isEmpty } from "es-toolkit/compat";

interface ImagesContentProps {
  pet: PetDto;
  initialImages: PetImageItem[];
}

const ImagesContent = ({ pet, initialImages }: ImagesContentProps) => {
  const queryClient = useQueryClient();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // 편집 중일 때만 임시 상태 사용 (null이면 photos 사용)
  const [editingImages, setEditingImages] = useState<PetImageItem[] | null>(null);
  const ownerId = pet.owner.userId ?? "";

  const isViewingMyPet = useIsMyPet(ownerId);

  const { data: queryPhotos, refetch } = useQuery({
    queryKey: [petImageControllerFindOne.name, pet.petId],
    queryFn: () => petImageControllerFindOne(pet.petId),
    select: (response) => response.data.data,
    enabled: isEmpty(initialImages),
  });

  // 서버에서 받은 초기 데이터 또는 React Query 데이터 사용
  const photos = useMemo(() => queryPhotos ?? initialImages ?? [], [initialImages, queryPhotos]);

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

      // 첫 번째 이미지(썸네일) 변경 여부 확인
      const isThumbnailChanged = photos[0]?.fileName !== displayImages[0]?.fileName;

      await mutateSaveImages(displayImages);
      await refetch();

      // 썸네일이 변경된 경우 썸네일 쿼리 무효화
      if (isThumbnailChanged) {
        await queryClient.invalidateQueries({
          queryKey: getPetThumbnailQueryKey(pet.petId),
        });
      }

      toast.success("이미지 수정이 완료되었습니다.");
      setEditingImages(null);
      setIsEditMode(false);
    } catch (error) {
      console.error("이미지 수정 실패:", error);
      toast.error("이미지 수정에 실패했습니다.");
    } finally {
      setIsProcessing(false);
    }
  }, [mutateSaveImages, displayImages, photos, refetch, queryClient, pet.petId]);

  return (
    <div className="shadow-xs flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 dark:bg-neutral-900">
      <div className="text-[14px] font-[600] text-gray-600 dark:text-gray-300">이미지</div>

      {!isEditMode && photos.length === 0 && (
        <div className="flex h-full flex-col items-center justify-center text-[14px] text-gray-500">
          등록된 이미지가 없습니다.
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

export default ImagesContent;
