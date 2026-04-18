"use client";

import { useLayoutEffect, useRef, useState } from "react";
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
import { ChevronDown, Pencil } from "lucide-react";
import MultiSelectPopover from "./MultiSelectPopover";
import { cn } from "@/lib/utils";

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

export { ChevronDown };
