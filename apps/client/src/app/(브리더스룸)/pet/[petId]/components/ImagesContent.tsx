"use client";

import DndImagePicker from "@/app/(브리더스룸)/components/Form/DndImagePicker";
import {
  petImageControllerFindOne,
  PetImageItem,
  petImageControllerSavePetImages,
  PetDto,
} from "@repo/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getPetThumbnailQueryKey } from "@/components/common/PetThumbnail";
import { toast } from "@/lib/toast";
import { useCallback, useEffect, useRef, useState } from "react";
import { useIsMyPet } from "@/hooks/useIsMyPet";
import { isEmpty } from "es-toolkit/compat";
import { ImageOff, Info } from "lucide-react";

interface ImagesContentProps {
  pet: PetDto;
  initialImages: PetImageItem[];
}

const ImagesContent = ({ pet, initialImages }: ImagesContentProps) => {
  const queryClient = useQueryClient();
  const ownerId = pet.owner.userId ?? "";
  const isViewingMyPet = useIsMyPet(ownerId);
  const [isSaving, setIsSaving] = useState(false);
  const [localPhotos, setLocalPhotos] = useState<PetImageItem[]>(initialImages ?? []);
  const photosRef = useRef<PetImageItem[]>(initialImages ?? []);

  const { data: queryPhotos } = useQuery({
    queryKey: [petImageControllerFindOne.name, pet.petId],
    queryFn: () => petImageControllerFindOne(pet.petId),
    select: (response) => response.data.data,
    enabled: isEmpty(initialImages),
  });

  // 서버 데이터가 변경되면 로컬 상태 동기화
  useEffect(() => {
    if (queryPhotos) {
      setLocalPhotos(queryPhotos);
      photosRef.current = queryPhotos;
    }
  }, [queryPhotos]);

  const { mutateAsync: mutateSaveImages } = useMutation({
    mutationFn: (updateFiles: PetImageItem[]) =>
      petImageControllerSavePetImages(pet.petId, { files: updateFiles }),
  });

  // 이미지 변경 시 즉시 UI 반영 + 서버 저장
  const handleImagesChange = useCallback(
    async (newImages: PetImageItem[]) => {
      const prevPhotos = photosRef.current;
      const isThumbnailChanged = prevPhotos[0]?.fileName !== newImages[0]?.fileName;

      // 낙관적 업데이트: UI 먼저 반영
      setLocalPhotos(newImages);
      photosRef.current = newImages;

      setIsSaving(true);
      try {
        await mutateSaveImages(newImages);

        if (isThumbnailChanged) {
          await queryClient.invalidateQueries({
            queryKey: getPetThumbnailQueryKey(pet.petId),
          });
        }
      } catch (error) {
        console.error("이미지 저장 실패:", error);
        toast.error("이미지 저장에 실패했습니다.");
        // 실패 시 롤백
        setLocalPhotos(prevPhotos);
        photosRef.current = prevPhotos;
      } finally {
        setIsSaving(false);
      }
    },
    [mutateSaveImages, queryClient, pet.petId],
  );

  const maxImgCount = 3;

  return (
    <div className="flex flex-1 flex-col gap-2 rounded-2xl bg-white p-3 shadow-xs dark:bg-neutral-900">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[14px] font-[600] text-gray-600 dark:text-gray-300">
          이미지
          <span className="flex items-center gap-1 rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-400 dark:bg-gray-800 dark:text-gray-500">
            <Info className="h-3 w-3" />
            최대 {maxImgCount}장까지 업로드 가능합니다.
          </span>
        </span>
      </div>

      {!isViewingMyPet && localPhotos.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-gray-400 dark:text-gray-500">
          <ImageOff className="h-8 w-8" />
          <span className="text-[14px]">등록된 이미지가 없습니다.</span>
        </div>
      ) : (
        <DndImagePicker
          max={maxImgCount}
          petId={pet.petId}
          disabled={!isViewingMyPet}
          isSaving={isSaving}
          images={localPhotos}
          onChange={handleImagesChange}
        />
      )}
    </div>
  );
};

export default ImagesContent;
