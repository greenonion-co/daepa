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
import { buildR2TransformedUrl, cn, compressImageFile } from "@/lib/utils";
import { toast } from "@/lib/toast";
import { X, Plus, Loader2, Info, Maximize2 } from "lucide-react";
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
  max?: number;
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
  max = 3,
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

  const onAdd = useCallback(
    async (files: File[]) => {
      if (!files || files.length === 0 || isBusy) return;

      const remain = Math.max(0, max - images.length);
      const picked = files.slice(0, remain);

      const targetFiles = picked.filter((f) => {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`이미지 용량이 너무 큽니다 (최대 5MB): ${f.name}`);
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
          <p className="text-[14px] font-[500] text-blue-500">
            최대 {max}장까지 업로드 가능합니다. (jpg, jpeg, png, gif, webp, avif)
          </p>
          <div className="mb-2 flex items-center gap-1 text-gray-600">
            <Info className="h-3 w-3" />
            <p className="text-[12px]">사진을 길게 눌러 순서를 변경할 수 있습니다.</p>
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
      {selectedIndex !== null && images[selectedIndex] && (
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
            {/* [SAMPLE_WATERMARK] 베타테스트용 워터마크 - 출시 시 삭제 */}
            <span
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none"
              aria-hidden="true"
            >
              <span
                className="rounded-sm border-2 border-white px-3 py-1 text-3xl font-bold tracking-widest text-white opacity-80"
                style={{ transform: "rotate(-30deg)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                SAMPLE
              </span>
            </span>
            {/* [/SAMPLE_WATERMARK] */}
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
      )}
    </div>
  );
}

function SortableThumb({
  id,
  src,
  disabled,
  isBusy,
  isUploading,
  onDelete,
  selected,
  onSelect,
}: {
  id: string;
  src: string;
  disabled?: boolean;
  /** 조작 비활성화 (업로드 중 or 저장 중) */
  isBusy?: boolean;
  /** CDN 업로드 중 (이미지가 아직 없으므로 스피너 표시) */
  isUploading?: boolean;
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
  } as const;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative h-24 w-full select-none",
        isDragging && "z-50 scale-105 rotate-3 shadow-xl",
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "absolute inset-0 overflow-hidden rounded-xl border-2 transition-all duration-200",
          isDragging
            ? "cursor-grabbing border-blue-400"
            : cn(
                "cursor-grab border-gray-200 hover:border-gray-300",
                selected && "border-blue-400 hover:border-blue-500",
              ),
        )}
        style={{
          touchAction: "none",
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (isBusy || isDragging) return;
          onSelect();
        }}
      >
        {isUploading ? (
          <div className="flex h-full w-full items-center justify-center bg-gray-50">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <Image
              src={buildR2TransformedUrl(src)}
              alt={`image_${id}`}
              fill
              className="cursor-pointer object-cover"
              draggable={false}
            />
            {/* [SAMPLE_WATERMARK] 베타테스트용 워터마크 - 출시 시 삭제 */}
            <span
              className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center select-none"
              aria-hidden="true"
            >
              <span
                className="rounded-sm border-2 border-white px-1 py-0.5 text-[0.5rem] font-bold tracking-widest text-white opacity-80"
                style={{ transform: "rotate(-40deg)", textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}
              >
                SAMPLE
              </span>
            </span>
            {/* [/SAMPLE_WATERMARK] */}
          </>
        )}
      </div>

      {!disabled && !isBusy && (
        <button
          type="button"
          onClick={onDelete}
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
