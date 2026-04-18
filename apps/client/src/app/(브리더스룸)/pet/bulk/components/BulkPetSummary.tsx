"use client";

import { AlertCircle } from "lucide-react";

type Props = {
  rowCount: number;
  errorCount: number;
};

export default function BulkPetSummary({ rowCount, errorCount }: Props) {
  return (
    <div className="flex items-center gap-4 border-t border-gray-200 px-3 py-2 text-xs dark:border-gray-700">
      <span className="text-gray-600 dark:text-gray-400">행: {rowCount}</span>
      {errorCount > 0 ? (
        <span className="flex items-center gap-1 text-red-600">
          <AlertCircle className="h-3.5 w-3.5" />
          오류 {errorCount}개 — 수정 후 업로드 가능
        </span>
      ) : (
        rowCount > 0 && <span className="text-emerald-600">검증 통과 — 업로드 가능</span>
      )}
    </div>
  );
}
