"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { buildR2TransformedUrl, cn, compressImageFile } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { X, Plus, Maximize2, ImageOff } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { isNil, range, remove } from "es-toolkit";
import { ACCEPT_IMAGE_FORMATS } from "../../constants";
import { tokenStorage } from "@/lib/tokenStorage";
import { IMAGE_TRANSFORMS } from "@/app/constants";
import ImageViewer from "./ImageViewer";
import { overlay } from "overlay-kit";

type PhotoItem = {
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
};

interface DndImagePickerProps {
  petId?: string;
  max: number;
  disabled?: boolean;
  isSaving?: boolean;
  images?: PhotoItem[];
  onChange?: (images: PhotoItem[]) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

// fetch API는 업로드 진행률 이벤트를 지원하지 않으므로 XMLHttpRequest를 사용한다.
// 둘 다 동일한 브라우저 네트워크 스택을 사용하므로 성능 차이는 없다.
function uploadWithProgress(
  url: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

export default function DndImagePicker({
  petId = "PENDING",
  max,
  disabled,
  isSaving = false,
  images = [],
  onChange = () => {},
}: DndImagePickerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileProgressRef = useRef<number[]>([]);
  const isBusy = isLoading || isSaving;
  const imageNamesInOrder = images.map(({ fileName }) => fileName);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(images.length > 0 ? 0 : null);

  useEffect(() => {
    if (images.length === 0) {
      setSelectedIndex(null);
      return;
    }
    // 선택된 인덱스가 범위를 벗어나면 마지막 항목으로 보정
    setSelectedIndex((prev) => {
      if (prev === null) return 0;
      if (prev >= images.length) return images.length - 1;
      return prev;
    });
  }, [images]);

  // PointerSensor는 마우스와 터치를 통합 처리 (onPointerDown 기반)
  // TouchSensor(onTouchStart)는 일부 모바일 브라우저에서 동작하지 않아 PointerSensor로 대체
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8,
    },
  });

  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(pointerSensor, keyboardSensor);

  const onAdd = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0 || isBusy) return;

      const remain = Math.max(0, max - images.length);
      const picked = files.slice(0, remain);

      const targetFiles = picked.filter((f) => {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`이미지 용량이 너무 큽니다 (최대 10MB): ${f.name}`);
          return false;
        }
        return true;
      });

      if (targetFiles.length === 0) return;

      setIsLoading(true);
      setUploadProgress(0);
      fileProgressRef.current = targetFiles.map(() => 0);

      try {
        const uploadedFiles = await Promise.all(
          targetFiles.map(async (file, fileIndex) => {
            // 1. 클라이언트 압축 (최대 1600px, WebP 변환)
            const compressed = await compressImageFile(file);

            // 2. Presigned URL 발급
            const presignedRes = await fetch("/api/upload/presigned-url", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${tokenStorage.getToken()}`,
              },
              body: JSON.stringify({
                petId,
                mimeType: compressed.type,
                size: compressed.size,
              }),
            });

            if (!presignedRes.ok) {
              throw new Error(`Presigned URL 발급 실패: ${file.name}`);
            }

            const { presignedUrl, fileName, url } = await presignedRes.json();

            // 3. R2에 직접 업로드 (진행률 추적)
            await uploadWithProgress(presignedUrl, compressed, (percent) => {
              fileProgressRef.current[fileIndex] = percent;
              const total = fileProgressRef.current.reduce((a, b) => a + b, 0);
              setUploadProgress(Math.round(total / fileProgressRef.current.length));
            });

            return { url, fileName, size: compressed.size, mimeType: compressed.type };
          }),
        );

        onChange([...images, ...uploadedFiles]);
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("이미지 업로드에 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [images, max, isBusy, onChange, petId],
  );

  const onDragEnd = (event: DragEndEvent) => {
    if (disabled || isBusy) return;

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
      if (disabled || isBusy) return;

      const prevPhotos = [...images];
      const nextPhotos = order.map((i) => prevPhotos[i]!);

      onChange(nextPhotos);
    },
    [disabled, isBusy, images, onChange],
  );

  const { getRootProps, getInputProps, open, isDragActive } = useDropzone({
    accept: ACCEPT_IMAGE_FORMATS,
    multiple: true,
    noClick: true,
    disabled: disabled || isBusy,
    onDropAccepted: async (accepted) => {
      if (disabled || isBusy) return;

      const remain = max - images.length;
      if (remain < accepted.length) {
        toast.error(`최대 ${max}장까지만 업로드할 수 있습니다.`);
      }
      await onAdd(accepted.slice(0, remain));
    },
    onDropRejected: (rejections) => {
      if (disabled || isBusy) return;

      const names = rejections.map((r) => r.file.name).join(", ");
      toast.error(`허용되지 않는 이미지 형식입니다: ${names}`);
    },
  });

  const handleDelete = useCallback(
    (index: number) => {
      const nextPhotos = [...images];
      if (index < nextPhotos.length) {
        remove(nextPhotos, (_, i) => i === index);
      }
      onChange?.(nextPhotos);
    },
    [images, onChange],
  );

  return (
    <div>
      {!disabled && (
        <>
          <p className="text-xs font-[500] text-blue-500">jpg, jpeg, png, gif, webp, avif</p>
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
              {images.map((photo, index) => (
                <SortableThumb
                  key={String(imageNamesInOrder[index])}
                  id={String(imageNamesInOrder[index])}
                  src={photo.url}
                  disabled={disabled}
                  isBusy={isBusy}
                  onDelete={() => handleDelete(index)}
                  selected={selectedIndex === index}
                  onSelect={() => {
                    if (isBusy) return;
                    setSelectedIndex(index);
                  }}
                />
              ))}
              {!disabled &&
                images.length < max &&
                (isLoading ? (
                  <div className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <span className="text-xs font-medium">{uploadProgress}%</span>
                    <div className="h-1.5 w-3/4 overflow-hidden rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-blue-500 transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={open}
                    disabled={isBusy}
                    className="flex h-24 w-full cursor-pointer items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-500 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* 선택한 이미지 미리보기 */}
      {selectedIndex !== null && images[selectedIndex] ? (
        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
          <div className="relative aspect-[4/3] w-full">
            <Image
              src={buildR2TransformedUrl(images[selectedIndex].url, IMAGE_TRANSFORMS.lg)}
              alt={`preview_${images[selectedIndex].fileName}`}
              fill
              className="object-cover"
              draggable={false}
              priority={false}
            />
            <button
              type="button"
              onClick={() => {
                const image = images[selectedIndex];
                if (!image) return;
                overlay.open(({ isOpen, close, unmount }) => (
                  <ImageViewer
                    isOpen={isOpen}
                    onClose={close}
                    onExit={unmount}
                    imageUrl={image.url}
                    fileName={image.fileName}
                  />
                ));
              }}
              className="absolute right-2 bottom-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
              aria-label="전체화면으로 보기"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        images.length === 0 && (
          <div className="mt-3 flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 text-gray-400 dark:border-gray-700 dark:text-gray-500">
            <ImageOff className="h-8 w-8" />
            <span className="text-[14px]">등록된 이미지가 없습니다.</span>
          </div>
        )
      )}
    </div>
  );
}

function SortableThumb({
  id,
  src,
  disabled,
  isBusy,
  onDelete,
  selected,
  onSelect,
}: {
  id: string;
  src: string;
  disabled?: boolean;
  /** 조작 비활성화 (업로드 중 or 저장 중) */
  isBusy?: boolean;
  onDelete: () => void;
  selected?: boolean;
  onSelect: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: disabled || isBusy,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    touchAction: "none",
    WebkitTouchCallout: "none",
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative h-24 w-full select-none overflow-hidden rounded-xl border-2 transition-all duration-200",
        isDragging
          ? "z-50 scale-105 rotate-3 shadow-xl cursor-grabbing border-blue-400"
          : cn(
              "cursor-grab border-gray-200 hover:border-gray-300",
              selected && "border-blue-400 hover:border-blue-500",
            ),
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (isBusy || isDragging) return;
        onSelect();
      }}
    >
      <Image
        src={buildR2TransformedUrl(src)}
        alt={`image_${id}`}
        fill
        className="pointer-events-none object-cover"
        draggable={false}
      />

      {!disabled && !isBusy && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className={cn(
            "absolute top-1 right-1 z-10 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-all duration-200",
            "hover:bg-red-600 active:scale-95",
            isDragging && "opacity-0",
          )}
          aria-label="사진 삭제"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
