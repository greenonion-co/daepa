"use client";

import { useRef, useState } from "react";
import { Plus, Trash2, Send, Copy, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { parsePetCsv } from "@/app/(브리더스룸)/lib/parsePetCsv";
import { toast } from "@/lib/toast";
import { MAX_ROWS } from "../hooks/useBulkPetForm";
import type { BulkPetRowValue } from "../lib/bulkPetSchema";

type Props = {
  rowCount: number;
  hasErrors: boolean;
  isUploading: boolean;
  selectedCount: number;
  uploadDisabledReason?: string;
  onAddRow: () => void;
  onDuplicateSelected: () => void;
  onDeleteSelected: () => void;
  onClearAll: () => void;
  onImport: (rows: Omit<BulkPetRowValue, "_clientId">[]) => { added: number; truncated: number };
  onUpload: () => void;
};

export default function BulkPetToolbar({
  rowCount,
  hasErrors,
  isUploading,
  selectedCount,
  uploadDisabledReason,
  onAddRow,
  onDuplicateSelected,
  onDeleteSelected,
  onClearAll,
  onImport,
  onUpload,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const atMax = rowCount >= MAX_ROWS;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = ""; // 같은 파일 재선택 허용
    try {
      const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
      const input = isXlsx ? await file.arrayBuffer() : await file.text();
      const parsed = parsePetCsv(input);
      const { added, truncated } = onImport(
        parsed as unknown as Omit<BulkPetRowValue, "_clientId">[],
      );
      if (truncated > 0) {
        toast.success(
          `${added}행이 추가되었습니다. 최대 ${MAX_ROWS}행 제한으로 ${truncated}행은 제외됨.`,
        );
      } else {
        toast.success(`${added}행이 추가되었습니다.`);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "파일 파싱 실패");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 p-3 dark:border-gray-700">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={onAddRow}
        disabled={atMax}
        title={atMax ? `최대 ${MAX_ROWS}행` : "빈 행 추가"}
        className="border-emerald-600 font-semibold text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
      >
        <Plus className="mr-1 h-4 w-4" />행 추가
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDuplicateSelected}
        disabled={selectedCount !== 1 || atMax}
        title={
          atMax
            ? `최대 ${MAX_ROWS}행`
            : selectedCount === 1
              ? "선택한 행 복제"
              : "복제하려면 1개 행만 선택하세요"
        }
      >
        <Copy className="mr-1 h-4 w-4" />행 복제
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onDeleteSelected}
        disabled={selectedCount === 0}
        className="text-red-600 hover:text-red-700"
      >
        <Trash className="mr-1 h-4 w-4" />
        선택 삭제{selectedCount > 0 && ` (${selectedCount})`}
      </Button>
      {/* TODO: 파일 업로드 / 템플릿 다운로드 기능 — 일시적 비노출. 로직은 보존됨. */}
      {/* <Button
        variant="outline"
        size="sm"
        onClick={() => fileInputRef.current?.click()}
        disabled={atMax}
      >
        <Upload className="mr-1 h-4 w-4" />파일 불러오기
      </Button>
      <Button variant="outline" size="sm" onClick={downloadBulkPetTemplate}>
        <FileDown className="mr-1 h-4 w-4" />템플릿 다운로드
      </Button> */}
      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs text-gray-500">
          {rowCount} / {MAX_ROWS}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setConfirmClear(true)}
          disabled={rowCount === 0}
          className="text-red-600"
        >
          <Trash2 className="mr-1 h-4 w-4" />
          전체 삭제
        </Button>
        <span title={uploadDisabledReason} className="inline-flex">
          <Button
            size="sm"
            onClick={onUpload}
            disabled={rowCount === 0 || hasErrors || isUploading}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Send className="mr-1 h-4 w-4" />
            {isUploading ? "업로드 중..." : "업로드"}
          </Button>
        </span>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>전체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              {rowCount}개의 행을 모두 지웁니다. 계속하시겠어요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onClearAll();
                setConfirmClear(false);
              }}
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
