"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { nanoid } from "nanoid";
import { useUser } from "@/hooks/useAuth";
import {
  bulkPetBatchSchema,
  zodIssuesToFieldErrors,
  type BulkPetRowValue,
  type FieldError,
} from "../lib/bulkPetSchema";
import {
  loadDraft,
  saveDraft,
  clearDraft,
  hasMeaningfulContent,
  type Draft,
} from "../lib/draftStorage";

export const MAX_ROWS = 100;

export type BulkPetRow = BulkPetRowValue & { _clientId: string };

function emptyRow(): BulkPetRow {
  return {
    _clientId: nanoid(8),
    name: "",
    species: "CR" as BulkPetRowValue["species"],
    isPublic: false,
    isBreeder: false,
    morphs: [],
    traits: [],
    foods: [],
    images: [],
  };
}

export type ServerFieldError = {
  rowIndex?: number;
  field?: string;
  code: string;
  message: string;
};

const DRAFT_SAVE_DEBOUNCE_MS = 500;

export function useBulkPetForm() {
  const user = useUser();
  const userId = user?.userId ?? null;
  const [rows, setRows] = useState<BulkPetRow[]>(() => [emptyRow()]);
  const [serverErrors, setServerErrors] = useState<ServerFieldError[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // updateCell 등이 항상 최신 rows를 참조할 수 있도록 ref로 보관 — deps에서 rows를 빼서 렌더 폭증 방지
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  // ── 임시 저장(localStorage) ───────────────
  // 마운트 시 draft가 있으면 사용자에게 복원 여부를 묻기 위해 pendingDraft로 노출
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  const [draftChecked, setDraftChecked] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const draft = loadDraft(userId);
    if (draft && hasMeaningfulContent(draft.rows)) {
      setPendingDraft(draft);
    }
    setDraftChecked(true);
  }, [userId]);

  // rows가 바뀔 때마다 debounced 저장. 단, 마운트 직후나 사용자가 아직 복원 선택을 안 한 상태에선 스킵
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!draftChecked || pendingDraft || !userId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (hasMeaningfulContent(rows)) {
        saveDraft(userId, rows);
      } else {
        clearDraft(userId);
      }
    }, DRAFT_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [rows, draftChecked, pendingDraft, userId]);

  const restoreDraft = useCallback(() => {
    if (!pendingDraft) return;
    setRows(pendingDraft.rows);
    setPendingDraft(null);
  }, [pendingDraft]);

  const dismissDraft = useCallback(() => {
    if (userId) clearDraft(userId);
    setPendingDraft(null);
  }, [userId]);

  // 클라이언트 검증 오류 (실시간)
  const clientErrors = useMemo<FieldError[]>(() => {
    if (rows.length === 0) return [];
    const parsed = bulkPetBatchSchema.safeParse(rows);
    if (parsed.success) return [];
    return zodIssuesToFieldErrors(parsed.error.issues);
  }, [rows]);

  /** rowIndex + field 기준으로 오류 메시지 lookup */
  const getCellError = useCallback(
    (rowIndex: number, field: string): string | null => {
      const clientHit = clientErrors.find(
        (e) => e.rowIndex === rowIndex && e.field === field,
      );
      if (clientHit) return clientHit.message;
      const serverHit = serverErrors.find(
        (e) => e.rowIndex === rowIndex && e.field === field,
      );
      if (serverHit) return serverHit.message;
      return null;
    },
    [clientErrors, serverErrors],
  );

  const getRowError = useCallback(
    (rowIndex: number): string | null => {
      const client = clientErrors.find((e) => e.rowIndex === rowIndex);
      if (client) return client.message;
      const server = serverErrors.find((e) => e.rowIndex === rowIndex);
      if (server) return server.message;
      return null;
    },
    [clientErrors, serverErrors],
  );

  const addRow = useCallback(() => {
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      return [...prev, emptyRow()];
    });
  }, []);

  const addRows = useCallback((count: number) => {
    setRows((prev) => {
      const remaining = MAX_ROWS - prev.length;
      const toAdd = Math.min(count, remaining);
      if (toAdd <= 0) return prev;
      return [...prev, ...Array.from({ length: toAdd }, emptyRow)];
    });
  }, []);

  const removeRow = useCallback((clientId: string) => {
    setRows((prev) => prev.filter((r) => r._clientId !== clientId));
  }, []);

  const removeRows = useCallback((clientIds: Set<string>) => {
    setRows((prev) => prev.filter((r) => !clientIds.has(r._clientId)));
  }, []);

  const duplicateRow = useCallback((clientId: string) => {
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      const idx = prev.findIndex((r) => r._clientId === clientId);
      if (idx < 0) return prev;
      const copy: BulkPetRow = {
        ...prev[idx]!,
        _clientId: nanoid(8),
        name: `${prev[idx]!.name} (복사)`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const updateCell = useCallback(
    <K extends keyof BulkPetRowValue>(
      clientId: string,
      field: K,
      value: BulkPetRowValue[K],
    ) => {
      setRows((prev) =>
        prev.map((r) => (r._clientId === clientId ? { ...r, [field]: value } : r)),
      );
      // 셀 수정 시 해당 행의 서버 오류는 일단 클리어 (재검증 후 다시 붙음).
      // rowsRef로 최신 rows를 참조해 deps에서 rows 의존을 제거 → updateCell이 stable
      setServerErrors((prev) =>
        prev.filter((e) => {
          const currentRows = rowsRef.current;
          const rowIdx = currentRows.findIndex((r) => r._clientId === clientId);
          if (rowIdx < 0) return true;
          return e.rowIndex !== rowIdx;
        }),
      );
    },
    [],
  );

  /** 파일 임포트 결과를 기존 rows에 병합. MAX_ROWS 초과분은 잘라내고 수량 반환 */
  const mergeImportedRows = useCallback(
    (imported: Omit<BulkPetRowValue, "_clientId">[]): { added: number; truncated: number } => {
      let added = 0;
      let truncated = 0;
      setRows((prev) => {
        const remaining = MAX_ROWS - prev.length;
        const toAdd = Math.min(imported.length, remaining);
        truncated = imported.length - toAdd;
        added = toAdd;
        const newRows: BulkPetRow[] = imported.slice(0, toAdd).map((row) => ({
          _clientId: nanoid(8),
          ...row,
        }));
        return [...prev, ...newRows];
      });
      return { added, truncated };
    },
    [],
  );

  const clearAll = useCallback(() => {
    setRows([]);
    setServerErrors([]);
    setSelectedIds(new Set());
    if (userId) clearDraft(userId);
  }, [userId]);

  // ── 행 선택 관리 ──────────────────────────
  const toggleSelection = useCallback((clientId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === rows.length && rows.length > 0) return new Set();
      return new Set(rows.map((r) => r._clientId));
    });
  }, [rows]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const deleteSelected = useCallback(() => {
    setRows((prev) => prev.filter((r) => !selectedIds.has(r._clientId)));
    setSelectedIds(new Set());
  }, [selectedIds]);

  const duplicateSelected = useCallback(() => {
    if (selectedIds.size !== 1) return;
    const clientId = [...selectedIds][0]!;
    setRows((prev) => {
      if (prev.length >= MAX_ROWS) return prev;
      const idx = prev.findIndex((r) => r._clientId === clientId);
      if (idx < 0) return prev;
      const copy: BulkPetRow = {
        ...prev[idx]!,
        _clientId: nanoid(8),
        name: `${prev[idx]!.name} (복사)`,
      };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, [selectedIds]);

  const setServerErrorsFromResponse = useCallback((errors: ServerFieldError[]) => {
    setServerErrors(errors);
  }, []);

  return {
    rows,
    addRow,
    addRows,
    removeRow,
    removeRows,
    duplicateRow,
    updateCell,
    mergeImportedRows,
    clearAll,
    clientErrors,
    serverErrors,
    setServerErrorsFromResponse,
    getCellError,
    getRowError,
    hasErrors: clientErrors.length > 0 || serverErrors.length > 0,
    errorCount: clientErrors.length + serverErrors.length,
    // 선택 관리
    selectedIds,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    deleteSelected,
    duplicateSelected,
    // 임시 저장 복원
    pendingDraft,
    restoreDraft,
    dismissDraft,
  };
}
