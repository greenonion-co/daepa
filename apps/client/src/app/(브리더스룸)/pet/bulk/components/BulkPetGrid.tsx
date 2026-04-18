"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { brPetControllerFindAll } from "@repo/api-client";
import { BULK_PET_COLUMNS, type ColumnDef } from "../lib/columns";
import type { BulkPetRowValue } from "../lib/bulkPetSchema";
import type { BulkPetRow } from "../hooks/useBulkPetForm";
import {
  SPECIES_DISPLAY,
  SEX_DISPLAY,
  GROWTH_DISPLAY,
  FOODS_DISPLAY,
  ADOPTION_STATUS_DISPLAY,
  getMorphDisplay,
  getTraitDisplay,
  formatEnumArray,
} from "../lib/enumMaps";
import {
  TextCell,
  NumberCell,
  DateCell,
  CheckboxCell,
  DropdownCell,
  MultiSelectCell,
  ParentCell,
} from "./BulkPetCells";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  rows: BulkPetRow[];
  updateCell: <K extends keyof BulkPetRowValue>(
    clientId: string,
    field: K,
    value: BulkPetRowValue[K],
  ) => void;
  getCellError: (rowIndex: number, field: string) => string | null;
  selectedIds: Set<string>;
  toggleSelection: (clientId: string) => void;
  toggleSelectAll: () => void;
};

function SpeciesDropdown({
  row,
  rowIndex,
  updateCell,
  getCellError,
}: {
  row: BulkPetRow;
  rowIndex: number;
  updateCell: Props["updateCell"];
  getCellError: Props["getCellError"];
}) {
  return (
    <DropdownCell
      value={row.species}
      displayMap={SPECIES_DISPLAY}
      onChange={(v) => updateCell(row._clientId, "species", v as BulkPetRowValue["species"])}
      error={getCellError(rowIndex, "species")}
      allowEmpty={false}
      triggerLabel={(_, label) => label.slice(0, 2)}
    />
  );
}

export default function BulkPetGrid({
  rows,
  updateCell,
  getCellError,
  selectedIds,
  toggleSelection,
  toggleSelectAll,
}: Props) {
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && !allSelected;
  // 내 펫 목록 (부모 제안용)
  const { data: myPetsData } = useQuery({
    queryKey: [brPetControllerFindAll.name, "bulk-parent-source"],
    queryFn: async () =>
      (await brPetControllerFindAll({ itemPerPage: 500, filterType: "MY" })).data,
    staleTime: 60 * 1000,
  });

  const fatherCandidates = useMemo(
    () => buildParentCandidates(myPetsData?.data ?? [], rows, "M"),
    [myPetsData, rows],
  );

  const motherCandidates = useMemo(
    () => buildParentCandidates(myPetsData?.data ?? [], rows, "F"),
    [myPetsData, rows],
  );

  return (
    <>
      <div className="overflow-auto border border-gray-200 dark:border-gray-700">
        <table className="w-max min-w-full border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="relative w-10 border-r border-gray-200 p-0 text-center font-medium dark:border-gray-700">
              <div
                role="button"
                tabIndex={0}
                onClick={toggleSelectAll}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleSelectAll();
                  }
                }}
                className="absolute inset-0 flex min-h-9 cursor-pointer items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onClick={(e) => e.stopPropagation()}
                  onCheckedChange={() => toggleSelectAll()}
                  aria-label="전체 선택"
                />
              </div>
            </th>
            <th className="w-12 border-r border-gray-200 px-2 py-2 text-left font-medium dark:border-gray-700">
              #
            </th>
            {BULK_PET_COLUMNS.map((col) => (
              <th
                key={col.field}
                style={{ width: col.width }}
                className="border-r border-gray-200 px-2 py-2 text-left font-medium dark:border-gray-700"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => {
            const isSelected = selectedIds.has(row._clientId);
            return (
              <tr
                key={row._clientId}
                className={`border-t border-gray-200 dark:border-gray-700 ${
                  isSelected ? "bg-emerald-50 dark:bg-emerald-950/30" : ""
                }`}
              >
                <td className="relative w-10 border-r border-gray-200 p-0 dark:border-gray-700">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleSelection(row._clientId)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggleSelection(row._clientId);
                      }
                    }}
                    className="absolute inset-0 flex cursor-pointer items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Checkbox
                      checked={isSelected}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleSelection(row._clientId)}
                      aria-label={`${rowIndex + 1}행 선택`}
                    />
                  </div>
                </td>
                <td className="w-12 border-r border-gray-200 bg-gray-50 px-2 py-0 text-center text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-900">
                  {rowIndex + 1}
                </td>
                {BULK_PET_COLUMNS.map((col) => (
                  <td
                    key={col.field}
                    style={{ width: col.width }}
                    className="relative border-r border-gray-200 p-0 last:border-r-0 dark:border-gray-700"
                  >
                    {renderCell(col, row, rowIndex, {
                      updateCell,
                      getCellError,
                      fatherCandidates,
                      motherCandidates,
                    })}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
      {rows.length < 2 && (
        <p className="mt-2 text-sm text-gray-500">
          상단의 &#34;행 추가&#34; 버튼을 눌러 개체 등록을 시작하세요.
        </p>
      )}
    </>
  );
}

function dedupeByValue<T extends { value: string }>(arr: T[]): T[] {
  const seen = new Set<string>();
  return arr.filter((item) => {
    if (!item.value) return false;
    if (seen.has(item.value)) return false;
    seen.add(item.value);
    return true;
  });
}

function buildParentCandidates(
  dbPets: { name?: string; sex?: string; species?: string; morphs?: string[] }[],
  rows: BulkPetRow[],
  sex: "M" | "F",
): { label: string; value: string }[] {
  const fromDb = dbPets
    .filter((p) => p.sex === sex && p.name)
    .map((p) => ({
      label: formatEnumArray(p.morphs, getMorphDisplay(p.species)),
      value: p.name as string,
    }));
  const fromBatch = rows
    .filter((r) => r.sex === sex && r.name)
    .map((r) => ({
      label: formatEnumArray(r.morphs, getMorphDisplay(r.species)),
      value: r.name as string,
    }));
  return dedupeByValue([...fromBatch, ...fromDb]).sort((a, b) =>
    a.value.localeCompare(b.value, "ko"),
  );
}

function renderCell(
  col: ColumnDef,
  row: BulkPetRow,
  rowIndex: number,
  {
    updateCell,
    getCellError,
    fatherCandidates,
    motherCandidates,
  }: {
    updateCell: Props["updateCell"];
    getCellError: Props["getCellError"];
    fatherCandidates: { label: string; value: string }[];
    motherCandidates: { label: string; value: string }[];
  },
) {
  const error = getCellError(rowIndex, col.field);

  switch (col.type) {
    case "species":
      return (
        <SpeciesDropdown
          row={row}
          rowIndex={rowIndex}
          updateCell={updateCell}
          getCellError={getCellError}
        />
      );
    case "text":
      return (
        <TextCell
          value={(row[col.field] as string | undefined) ?? ""}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          error={error}
        />
      );
    case "number":
      return (
        <NumberCell
          value={row[col.field] as number | null | undefined}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          error={error}
        />
      );
    case "date":
      return (
        <DateCell
          value={row[col.field] as string | undefined}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          error={error}
        />
      );
    case "checkbox":
      return (
        <CheckboxCell
          value={row[col.field] as boolean | undefined}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
        />
      );
    case "dropdown": {
      const displayMap = dropdownMap(col.dropdownKey!);
      return (
        <DropdownCell
          value={row[col.field] as string | undefined}
          displayMap={displayMap}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          error={error}
        />
      );
    }
    case "multiSelect": {
      const displayMap = multiSelectMap(col.multiSelectKey!, row.species);
      return (
        <MultiSelectCell
          value={row[col.field] as string[] | undefined}
          displayMap={displayMap}
          title={col.header}
          maxSelection={col.maxSelection}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          error={error}
        />
      );
    }
    case "parent": {
      const candidates = col.parentRole === "father" ? fatherCandidates : motherCandidates;
      return (
        <ParentCell
          value={row[col.field] as string | undefined}
          onChange={(v) => updateCell(row._clientId, col.field, v as never)}
          candidates={candidates}
          error={error}
        />
      );
    }
    default:
      return null;
  }
}

function dropdownMap(key: NonNullable<ColumnDef["dropdownKey"]>): Record<string, string> {
  switch (key) {
    case "species":
      return SPECIES_DISPLAY;
    case "sex":
      return SEX_DISPLAY;
    case "growth":
      return GROWTH_DISPLAY;
    case "adoptionStatus":
      return ADOPTION_STATUS_DISPLAY;
  }
}

function multiSelectMap(
  key: NonNullable<ColumnDef["multiSelectKey"]>,
  species: BulkPetRowValue["species"],
): Record<string, string> {
  switch (key) {
    case "morphs":
      return getMorphDisplay(species);
    case "traits":
      return getTraitDisplay(species);
    case "foods":
      return FOODS_DISPLAY;
  }
}
