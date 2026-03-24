"use client";

import { useState } from "react";
import { PetDto } from "@repo/api-client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import useTableStore from "../store/table";
import {
  EXPORT_FIELDS,
  ExportFieldKey,
  exportPetExcel,
} from "../utils/exportPetExcel";

interface ExportToolbarProps {
  data: PetDto[];
  onClose: () => void;
}

export default function ExportToolbar({ data, onClose }: ExportToolbarProps) {
  const { rowSelection, setRowSelection } = useTableStore();
  const [selectedFields, setSelectedFields] = useState<Set<ExportFieldKey>>(
    () => new Set(EXPORT_FIELDS.filter((f) => f.defaultChecked !== false).map((f) => f.key)),
  );
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const selectedCount = Object.keys(rowSelection).length;

  const toggleField = (key: ExportFieldKey) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 1) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    const all: Record<string, boolean> = {};
    data.forEach((pet) => {
      all[pet.petId] = true;
    });
    setRowSelection(all);
  };

  const handleDeselectAll = () => {
    setRowSelection({});
  };

  const handleDownload = () => {
    const selectedPets = data.filter((pet) => rowSelection[pet.petId]);
    const fields = EXPORT_FIELDS.filter((f) => selectedFields.has(f.key)).map(
      (f) => f.key,
    );
    exportPetExcel(selectedPets, fields);
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900 dark:bg-blue-950/30">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" onClick={handleSelectAll}>
          전체선택
        </Button>
        <Button size="sm" variant="outline" onClick={handleDeselectAll}>
          전체해제
        </Button>
        <div className="mx-1 h-4 w-px bg-gray-300 dark:bg-gray-600" />
        <Button
          size="sm"
          onClick={() => setIsConfirmOpen(true)}
          disabled={selectedCount === 0}
        >
          내려받기 ({selectedCount})
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          취소
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
          추출 항목:
        </span>
        {EXPORT_FIELDS.map((field) => (
          <label
            key={field.key}
            className="flex cursor-pointer items-center gap-1.5"
          >
            <Checkbox
              checked={selectedFields.has(field.key)}
              onCheckedChange={() => toggleField(field.key)}
            />
            <span className="text-xs text-gray-700 dark:text-gray-300">
              {field.label}
            </span>
          </label>
        ))}
      </div>

      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>개체 목록 내려받기</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            선택한 <strong>{selectedCount}마리</strong>의 개체 정보를 Excel
            파일로 내려받겠습니까?
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleDownload}>확인</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
