"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronDown, CirclePlus, ImagePlus, Loader2, Pencil, Upload, X } from "lucide-react";
import { overlay } from "overlay-kit";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { buildR2TransformedUrl, compressImageFile } from "@/lib/utils";
import { tokenStorage } from "@/lib/tokenStorage";
import { toast } from "@/lib/toast";
import { ACCEPT_IMAGE_FORMATS } from "@/app/(브리더스룸)/constants";
import type { PetImageItem } from "@repo/api-client";
import MultiSelectPopover from "./MultiSelectPopover";
import { MAX_IMAGES_PER_ROW } from "../lib/bulkPetSchema";
import { cn } from "@/lib/utils";

const MAX_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const CELL_BASE =
  "h-9 w-full rounded-none border-0 bg-transparent px-2 py-1 text-sm focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-emerald-500";

type CellWrapperProps = {
  error?: string | null;
  children: React.ReactNode;
};

/** 공용 셀 래퍼 — 오류 시 빨간 테두리 + tooltip */
function CellWrapper({ error, children }: CellWrapperProps) {
  return (
    <div
      className={cn("relative h-full", error && "ring-2 ring-red-500 ring-inset")}
      title={error ?? undefined}
    >
      {children}
      {error && (
        <span className="pointer-events-none absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-500" />
      )}
    </div>
  );
}

// ── Text ─────────────────────────────────────
export function TextCell({
  value,
  onChange,
  error,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string | null;
  placeholder?: string;
}) {
  return (
    <CellWrapper error={error}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={CELL_BASE}
      />
    </CellWrapper>
  );
}

// ── Number ──────────────────────────────────
export function NumberCell({
  value,
  onChange,
  error,
}: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  error?: string | null;
}) {
  return (
    <CellWrapper error={error}>
      <Input
        type="number"
        step="0.1"
        value={value ?? ""}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        className={CELL_BASE}
      />
    </CellWrapper>
  );
}

// ── Date ────────────────────────────────────
export function DateCell({
  value,
  onChange,
  error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  error?: string | null;
}) {
  return (
    <CellWrapper error={error}>
      <Input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={CELL_BASE}
      />
    </CellWrapper>
  );
}

// ── Checkbox ────────────────────────────────
export function CheckboxCell({
  value,
  onChange,
}: {
  value: boolean | undefined;
  onChange: (v: boolean) => void;
}) {
  const toggle = () => onChange(!value);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      className="absolute inset-0 flex cursor-pointer items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      <Checkbox
        checked={!!value}
        onClick={(e) => e.stopPropagation()}
        onCheckedChange={(v) => onChange(v === true)}
      />
    </div>
  );
}

// ── Dropdown ────────────────────────────────
export function DropdownCell({
  value,
  displayMap,
  placeholder,
  onChange,
  error,
  allowEmpty = true,
  triggerLabel,
}: {
  value: string | undefined;
  displayMap: Record<string, string>;
  placeholder?: string;
  onChange: (v: string | undefined) => void;
  error?: string | null;
  allowEmpty?: boolean;
  /** 트리거(닫힌 상태)에만 적용되는 라벨 변환. 드롭다운 옵션은 displayMap 원본을 사용. */
  triggerLabel?: (key: string, fullLabel: string) => string;
}) {
  const entries = Object.entries(displayMap);
  const EMPTY = "__EMPTY__";
  const fullLabel = value ? (displayMap[value] ?? value) : "";
  const shownLabel = value && triggerLabel ? triggerLabel(value, fullLabel) : fullLabel;
  return (
    <CellWrapper error={error}>
      <Select
        value={value ?? (allowEmpty ? EMPTY : undefined)}
        onValueChange={(v) => onChange(v === EMPTY ? undefined : v)}
      >
        <SelectTrigger
          className={cn(CELL_BASE, "justify-between")}
          title={triggerLabel && fullLabel ? fullLabel : undefined}
        >
          {triggerLabel && value ? (
            <span className="truncate">{shownLabel}</span>
          ) : (
            <SelectValue placeholder={placeholder} />
          )}
        </SelectTrigger>
        <SelectContent>
          {allowEmpty && <SelectItem value={EMPTY}>—</SelectItem>}
          {entries.map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </CellWrapper>
  );
}

// ── MultiSelect ─────────────────────────────
export function MultiSelectCell({
  value,
  displayMap,
  title,
  maxSelection,
  onChange,
  error,
}: {
  value: string[] | undefined;
  displayMap: Record<string, string>;
  title: string;
  maxSelection?: number;
  onChange: (v: string[]) => void;
  error?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const selected = value ?? [];
  const firstLabel = selected.length > 0 ? (displayMap[selected[0]!] ?? selected[0]!) : "";
  const moreCount = Math.max(0, selected.length - 1);
  const fullTooltip = selected.map((k) => displayMap[k] ?? k).join(", ");

  return (
    <CellWrapper error={error}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={fullTooltip || undefined}
        className={cn(
          CELL_BASE,
          "flex items-center justify-between gap-1 hover:bg-gray-50 dark:hover:bg-gray-800",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-1 text-left">
          {firstLabel ? (
            <span className="truncate">{firstLabel}</span>
          ) : (
            <span className="text-gray-400">선택</span>
          )}
          {moreCount > 0 && (
            <span className="shrink-0 rounded bg-gray-200 px-1 text-[11px] font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200">
              +{moreCount}
            </span>
          )}
        </span>
        <Pencil className="h-3 w-3 shrink-0 text-gray-400" />
      </button>
      <MultiSelectPopover
        isOpen={open}
        title={title}
        displayMap={displayMap}
        initialValue={selected}
        maxSelection={maxSelection}
        onClose={() => setOpen(false)}
        onSelect={(v) => {
          onChange(v);
          setOpen(false);
        }}
      />
    </CellWrapper>
  );
}

// ── Parent (텍스트 입력 + datalist, 6글자 초과 시 말줄임) ───────
const PARENT_DISPLAY_LIMIT = 6;

export function ParentCell({
  value,
  onChange,
  candidates,
  error,
}: {
  value: string | undefined;
  onChange: (v: string) => void;
  /** 제안 후보: {label, value} — value=이름, label=모프 표시용 */
  candidates: { label: string; value: string }[];
  error?: string | null;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false);
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null);
  const full = value ?? "";
  const isLong = full.length > PARENT_DISPLAY_LIMIT;
  const showOverlay = !focused && isLong;

  const filtered = full
    ? candidates.filter(
        (c) =>
          c.value.toLowerCase().includes(full.toLowerCase()) ||
          c.label.toLowerCase().includes(full.toLowerCase()),
      )
    : candidates;
  const showDropdown = focused && filtered.length > 0;

  useLayoutEffect(() => {
    if (!showDropdown) return;
    const update = () => {
      const el = wrapperRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, top: r.bottom, width: r.width });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [showDropdown]);

  return (
    <CellWrapper error={error}>
      <div ref={wrapperRef} className="relative h-full">
        <Input
          value={full}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="개체 이름"
          title={full}
          className={cn(CELL_BASE, showOverlay && "text-transparent")}
        />
        {showOverlay && (
          <span
            className="pointer-events-none absolute inset-0 flex items-center truncate px-2 text-sm"
            title={full}
          >
            {full.slice(0, PARENT_DISPLAY_LIMIT)}…
          </span>
        )}
        {showDropdown &&
          rect &&
          createPortal(
            <ul
              className="fixed z-50 max-h-60 min-w-[180px] overflow-auto rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg dark:border-gray-700 dark:bg-zinc-900"
              style={{ left: rect.left, top: rect.top, width: Math.max(rect.width, 220) }}
            >
              {filtered.map((c) => (
                <li
                  key={c.value}
                  // mousedown으로 처리: input blur보다 먼저 발생해야 선택이 유지됨
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onChange(c.value);
                    setFocused(false);
                  }}
                  className="flex cursor-pointer items-baseline gap-2 px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{c.value}</span>
                  {c.label && (
                    <span className="truncate text-xs text-gray-400 dark:text-gray-500">
                      {c.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>,
            document.body,
          )}
      </div>
    </CellWrapper>
  );
}

// ── Row action buttons ──────────────────────
export function RowActions({
  onDuplicate,
  onDelete,
}: {
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={onDuplicate}
        className="rounded px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800"
        title="복제"
      >
        ⧉
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="rounded px-1.5 py-0.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
        title="삭제"
      >
        ✕
      </button>
    </div>
  );
}

// ── Images (썸네일 스트립 + 모달 편집) ───────────────
export function ImagesCell({
  value,
  onChange,
  error,
}: {
  value: PetImageItem[] | undefined;
  onChange: (v: PetImageItem[]) => void;
  error?: string | null;
}) {
  const images = value ?? [];

  const openEditor = () => {
    overlay.open(({ isOpen, close }) => (
      <ImagesEditorModal
        isOpen={isOpen}
        onClose={close}
        initialImages={images}
        max={MAX_IMAGES_PER_ROW}
        onChange={onChange}
      />
    ));
  };

  return (
    <CellWrapper error={error}>
      <button
        type="button"
        onClick={openEditor}
        title={images.length ? `${images.length}장 — 클릭하여 편집` : "이미지 추가"}
        className={cn(CELL_BASE, "flex items-center gap-1 hover:bg-gray-50 dark:hover:bg-gray-800")}
      >
        {images.length === 0 ? (
          <span className="flex items-center gap-1 text-gray-400">
            <ImagePlus className="h-3.5 w-3.5" />
            이미지
          </span>
        ) : (
          <span className="flex flex-1 items-center gap-1">
            {images.slice(0, MAX_IMAGES_PER_ROW).map((img) => (
              <span
                key={img.fileName}
                className="relative inline-block h-6 w-6 overflow-hidden rounded border border-gray-200 dark:border-gray-700"
              >
                <Image
                  src={buildR2TransformedUrl(img.url)}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-cover"
                  draggable={false}
                />
              </span>
            ))}
            <span className="ml-1 text-xs text-gray-500">
              {images.length}/{MAX_IMAGES_PER_ROW}
            </span>
          </span>
        )}
        <CirclePlus className="ml-auto h-3.5 w-3.5 shrink-0 text-gray-400" />
      </button>
    </CellWrapper>
  );
}

/**
 * 모달 내부 상태로 이미지 목록을 보관해 즉시 재렌더되도록 보장.
 * overlay-kit으로 열린 모달은 트리 외부에 마운트되어 부모 props 변화를 못 받으므로
 * 자체 state가 필요. 변경 시마다 부모(onChange)로도 동기화한다.
 */
function ImagesEditorModal({
  isOpen,
  onClose,
  initialImages,
  max,
  onChange,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialImages: PetImageItem[];
  max: number;
  onChange: (next: PetImageItem[]) => void;
}) {
  const [images, setImages] = useState(initialImages);
  const [uploading, setUploading] = useState(false);

  const handleChange = (next: PetImageItem[]) => {
    setImages(next);
    onChange(next);
  };

  // 업로드 중에는 ESC/배경 클릭으로 닫히지 않도록 가드
  const handleOpenChange = (open: boolean) => {
    if (!open && uploading) return;
    if (!open) onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" showCloseButton={!uploading}>
        <DialogHeader>
          <DialogTitle>이미지 업로드 (최대 {max}장)</DialogTitle>
        </DialogHeader>
        <SimpleImageUploader
          images={images}
          max={max}
          onChange={handleChange}
          onUploadingChange={setUploading}
        />
      </DialogContent>
    </Dialog>
  );
}

/** 단일 셀에서 사용하는 가벼운 이미지 업로더 — 드래그앤드롭 + 클릭 업로드 */
function SimpleImageUploader({
  images,
  max,
  onChange,
  onUploadingChange,
}: {
  images: PetImageItem[];
  max: number;
  onChange: (next: PetImageItem[]) => void;
  /** 업로드 진행 상태 — 모달 측에서 닫기 차단용으로 구독 */
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const [pendingCount, setPendingCount] = useState(0);
  const uploading = pendingCount > 0;
  const remaining = max - images.length;
  const isFull = remaining <= 0;

  // 진행 상태 부모로 전파
  useEffect(() => {
    onUploadingChange?.(uploading);
  }, [uploading, onUploadingChange]);

  const handleFiles = async (files: File[]) => {
    if (uploading || isFull) return;
    const accepted = files.slice(0, remaining).filter((f) => {
      if (f.size > MAX_IMAGE_FILE_SIZE) {
        toast.error(`이미지 용량이 너무 큽니다 (최대 10MB): ${f.name}`);
        return false;
      }
      return true;
    });
    if (accepted.length === 0) return;

    setPendingCount(accepted.length);
    try {
      const uploaded = await Promise.all(
        accepted.map(async (file) => {
          const compressed = await compressImageFile(file);
          const presignedRes = await fetch("/api/upload/presigned-url", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${tokenStorage.getToken()}`,
            },
            body: JSON.stringify({
              petId: "PENDING",
              mimeType: compressed.type,
              size: compressed.size,
            }),
          });
          if (!presignedRes.ok) {
            throw new Error(`Presigned URL 발급 실패: ${file.name}`);
          }
          const { presignedUrl, fileName, url } = await presignedRes.json();
          const putRes = await fetch(presignedUrl, {
            method: "PUT",
            headers: { "Content-Type": compressed.type },
            body: compressed,
          });
          if (!putRes.ok) throw new Error(`업로드 실패: ${file.name}`);
          return {
            url,
            fileName,
            size: compressed.size,
            mimeType: compressed.type,
          } satisfies PetImageItem;
        }),
      );
      onChange([...images, ...uploaded]);
    } catch (err) {
      console.error("이미지 업로드 실패:", err);
      toast.error("이미지 업로드에 실패했습니다.");
    } finally {
      setPendingCount(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: ACCEPT_IMAGE_FORMATS,
    multiple: true,
    disabled: uploading || isFull,
    onDropAccepted: handleFiles,
    onDropRejected: (rejections) => {
      const names = rejections.map((r) => r.file.name).join(", ");
      toast.error(`허용되지 않는 이미지 형식입니다: ${names}`);
    },
  });

  const handleDelete = (fileName: string) => {
    onChange(images.filter((img) => img.fileName !== fileName));
  };

  // 드래그 정렬: PointerSensor의 distance constraint로 클릭(삭제 버튼)과 충돌 방지
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = images.findIndex((img) => img.fileName === active.id);
    const newIndex = images.findIndex((img) => img.fileName === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(images, oldIndex, newIndex));
  };

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed px-4 py-6 text-sm transition-colors",
          uploading
            ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-950/30"
            : isDragActive
              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
          (uploading || isFull) && "cursor-not-allowed",
          uploading && "pointer-events-none",
          !uploading && !isFull && "cursor-pointer",
          isFull && !uploading && "opacity-50",
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="font-medium text-emerald-700 dark:text-emerald-400">
              {pendingCount}장 업로드 중...
            </span>
            <span className="text-xs text-gray-500">
              HEIC 변환·압축이 포함되면 1장당 수 초가 걸릴 수 있습니다
            </span>
          </>
        ) : isFull ? (
          <>
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="text-gray-500">최대 {max}장까지 등록 가능합니다.</span>
          </>
        ) : (
          <>
            <Upload className="h-6 w-6 text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-200">
              이미지를 드래그하거나 클릭해 업로드
            </span>
            <span className="text-xs text-gray-500">
              JPG · PNG · WebP · GIF · HEIC · 최대 10MB · {images.length}/{max}장
            </span>
          </>
        )}
      </div>

      {(images.length > 0 || uploading) && (
        <>
          <DndContext sensors={sensors} onDragEnd={handleDragEnd} autoScroll={false}>
            <SortableContext
              items={images.map((img) => img.fileName)}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-3 gap-2">
                {images.map((img) => (
                  <SortableImageThumb
                    key={img.fileName}
                    id={img.fileName}
                    url={img.url}
                    onDelete={() => handleDelete(img.fileName)}
                  />
                ))}
                {Array.from({ length: pendingCount }).map((_, i) => (
                  <div
                    key={`pending-${i}`}
                    className="flex aspect-square animate-pulse items-center justify-center rounded-md border-2 border-dashed border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>
          {images.length > 1 && !uploading && (
            <p className="text-xs text-gray-500">드래그하여 순서를 변경할 수 있습니다.</p>
          )}
        </>
      )}
    </div>
  );
}

function SortableImageThumb({
  id,
  url,
  onDelete,
}: {
  id: string;
  url: string;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? "none" : transition,
    touchAction: "none" as const,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative aspect-square cursor-grab overflow-hidden rounded-md border-2 select-none",
        isDragging
          ? "z-10 scale-105 cursor-grabbing border-emerald-400 shadow-lg"
          : "border-gray-200 dark:border-gray-700",
      )}
    >
      <Image
        src={buildR2TransformedUrl(url)}
        alt=""
        fill
        sizes="120px"
        className="pointer-events-none object-cover"
        draggable={false}
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className={cn(
          "absolute top-1 right-1 inline-flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-colors hover:bg-red-600",
          isDragging && "opacity-0",
        )}
        aria-label="이미지 삭제"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export { ChevronDown };
