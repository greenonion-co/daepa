"use client";

import {
  DndContext,
  DragEndEvent,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { buildR2TransformedUrl, cn } from "@/lib/utils";
import { X, Plus, Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import { usePetStore } from "../../register/store/pet";
import { useCallback, useState } from "react";
import { isNil, range, remove } from "es-toolkit";
import { ACCEPT_IMAGE_FORMATS } from "../../constants";
import { tokenStorage } from "@/lib/tokenStorage";
import { PhotoItem } from "../../register/types";

interface DndImagePickerProps {
  max?: number;
  disabled?: boolean;
}

export default function DndImagePicker({ max = 3, disabled }: DndImagePickerProps) {
  const { formData, setFormData } = usePetStore();
  const [isLoading, setIsLoading] = useState(false);
  const photos: PhotoItem[] = formData.photos ?? [];
  const imageNamesInOrder = photos.map(({ fileName }) => fileName) ?? [];

  // 터치와 마우스 센서 설정
  const mouseSensor = useSensor(MouseSensor, {
    // 마우스 드래그 시작을 위한 최소 이동 거리
    activationConstraint: {
      distance: 8,
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    // 터치 드래그 시작을 위한 설정
    activationConstraint: {
      delay: 200, // 200ms 지연 후 드래그 시작
      tolerance: 8, // 8px 이동까지는 허용
    },
  });

  const sensors = useSensors(mouseSensor, touchSensor);

  const onAdd = async (files: File[]) => {
    if (!files || files.length === 0 || isLoading) return;

    const currentPhotos: string[] = (formData.photos ?? []) as string[];
    const remain = Math.max(0, max - currentPhotos.length);
    const picked = files.slice(0, remain);

    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const targetFiles = picked.filter((f) => {
      if (f.size > MAX_FILE_SIZE) {
        toast.error(`이미지 용량이 너무 큽니다 (최대 5MB): ${f.name}`);
        return false;
      }
      return true;
    });

    if (targetFiles.length === 0) return;

    setIsLoading(true);
    try {
      const uploadedPendingFiles = await Promise.all(
        targetFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("petId", "PENDING");

          const response = await fetch("/api/upload/image", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${tokenStorage.getToken()}`,
            },
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for file ${file.name}`);
          }

          const result = await response.json();
          return result;
        }),
      );
      const addedPhotos = uploadedPendingFiles.map(({ url, fileName, size, mimeType }) => ({
        url,
        fileName,
        size,
        mimeType,
      }));

      setFormData((prev) => ({
        ...prev,
        photos: [...(prev?.photos ?? []), ...addedPhotos],
      }));
    } catch (error) {
      console.error("Image upload failed:", error);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled || isLoading) return;

    const { active, over } = event;
    if (isNil(over) || active.id === over.id) return;

    const [oldIndex, newIndex] = [
      imageNamesInOrder.indexOf(String(active.id)),
      imageNamesInOrder.indexOf(String(over.id)),
    ];
    if (oldIndex === -1 || newIndex === -1) return;

    const imageIndices = range(imageNamesInOrder.length);
    const indexOrdered = arrayMove(imageIndices, oldIndex, newIndex);
    onReorder(indexOrdered);
  };

  const onReorder = useCallback(
    (order: number[]) => {
      if (disabled || isLoading) return;

      setFormData((prev) => {
        const prevPhotos = [...(prev.photos ?? [])];
        const nextPhotos = order.map((i) => prevPhotos[i]);

        return { ...prev, photos: nextPhotos };
      });
    },
    [disabled, isLoading, setFormData],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: ACCEPT_IMAGE_FORMATS,
    multiple: true,
    noClick: true,
    disabled: disabled || isLoading,
    onDropAccepted: async (accepted) => {
      if (disabled || isLoading) return;

      const remain = max - photos.length;
      if (remain < accepted.length) {
        toast.error(`최대 ${max}장까지만 업로드할 수 있습니다.`);
      }
      await onAdd(accepted.slice(0, remain));
    },
    onDropRejected: (rejections) => {
      if (disabled || isLoading) return;

      const names = rejections.map((r) => r.file.name).join(", ");
      toast.error(`허용되지 않는 이미지 형식입니다: ${names}`);
    },
  });

  const handleDelete = useCallback(
    (index: number) => {
      setFormData((prev) => {
        const nextPhotos = [...(prev.photos ?? [])];
        if (index < nextPhotos.length) {
          remove(nextPhotos, (_, i) => i === index);
        }
        return { ...prev, photos: nextPhotos };
      });
    },
    [setFormData],
  );

  return (
    <div>
      {!disabled && (
        <>
          <p className="text-sm text-blue-500">
            최대 {max}장까지 업로드 가능합니다. (jpg, jpeg, png, gif, webp, avif)
          </p>
          <div className="mb-2 flex items-center gap-1 text-gray-600">
            <Info className="h-3 w-3" />
            <p className="text-xs">사진을 길게 눌러 순서를 변경할 수 있습니다.</p>
          </div>
        </>
      )}
      <div {...getRootProps()} className="relative">
        <input {...getInputProps()} />
        <DndContext
          sensors={sensors}
          onDragEnd={onDragEnd}
          // 모바일에서 스크롤과 드래그가 충돌하지 않도록 설정
          autoScroll={false}
        >
          <SortableContext items={imageNamesInOrder} strategy={rectSortingStrategy}>
            <div className={cn("grid grid-cols-3 gap-2", isDragActive && "ring-2 ring-blue-400")}>
              {photos.map((photo, index) => (
                <SortableThumb
                  key={String(imageNamesInOrder[index])}
                  id={String(imageNamesInOrder[index])}
                  src={photo.url}
                  disabled={disabled}
                  isLoading={isLoading}
                  onDelete={() => handleDelete(index)}
                />
              ))}
              {!disabled &&
                photos.length < max &&
                (!isLoading ? (
                  <button
                    type="button"
                    onClick={open}
                    className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                ) : (
                  <div className="flex h-24 w-full items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </div>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}

function SortableThumb({
  id,
  src,
  disabled,
  isLoading,
  onDelete,
}: {
  id: string;
  src: string;
  disabled?: boolean;
  isLoading?: boolean;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    // 드래그 중일 때 다른 스타일 적용을 위해
    disabled: disabled || isLoading,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative h-24 w-full select-none",
        isDragging && "z-50 rotate-3 scale-105 shadow-xl", // 드래그 중 스타일
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
          isDragging
            ? "cursor-grabbing border-blue-400"
            : "cursor-grab border-gray-200 hover:border-gray-300",
        )}
        // 터치 이벤트 최적화
        style={{
          touchAction: "none", // 브라우저의 기본 터치 동작 방지
        }}
      >
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <Image
            src={buildR2TransformedUrl(src)}
            alt={`image_${id}`}
            fill
            className="object-cover"
            // 이미지 드래그 방지
            draggable={false}
          />
        )}
      </div>

      {!disabled && !isLoading && (
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "absolute right-1 top-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all duration-200",
            "hover:bg-red-600 active:scale-95",
            isDragging && "opacity-0", // 드래그 중에는 삭제 버튼 숨김
          )}
          aria-label="사진 삭제"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
