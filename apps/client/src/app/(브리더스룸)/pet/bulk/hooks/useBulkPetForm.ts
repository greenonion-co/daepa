"use client";

import { useCallback, useMemo, useState } from "react";
import { nanoid } from "nanoid";
import {
  bulkPetBatchSchema,
  zodIssuesToFieldErrors,
  type BulkPetRowValue,
  type FieldError,
} from "../lib/bulkPetSchema";

export const MAX_ROWS = 200;

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
  };
}

export type ServerFieldError = {
  rowIndex?: number;
  field?: string;
  code: string;
  message: string;
};

export function useBulkPetForm() {
  const [rows, setRows] = useState<BulkPetRow[]>(() => [emptyRow()]);
  const [serverErrors, setServerErrors] = useState<ServerFieldError[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      // 셀 수정 시 해당 행의 서버 오류는 일단 클리어 (재검증 후 다시 붙음)
      setServerErrors((prev) => prev.filter((e) => {
        const row = rows.find((r) => r._clientId === clientId);
        if (!row) return true;
        const rowIdx = rows.indexOf(row);
        return e.rowIndex !== rowIdx;
      }));
    },
    [rows],
  );

  /** 파일 임포트 결과를 기존 rows에 병합. 200 초과분은 잘라내고 수량 반환 */
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
  }, []);

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
  };
}
