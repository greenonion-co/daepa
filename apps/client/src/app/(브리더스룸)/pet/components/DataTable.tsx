"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Checkbox } from "@/components/ui/checkbox";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTableStore from "../store/table";
import {
  PetDto,
  PetDtoGrowth,
  AdoptionDto,
  UpdateAdoptionDtoStatus,
  petControllerUpdate,
  petControllerFindPetByPetId,
  petAdoptionControllerCreatePetAdoption,
  petAdoptionControllerUpdatePetAdoption,
} from "@repo/api-client";
import { patchPetListCache } from "../utils/patchPetListCache";
import Loading from "@/components/common/Loading";
import { cn } from "@/lib/utils";

import { useAppRouter } from "@/hooks/useAppRouter";
import PetDetailModal from "../[petId]/components/PetDetailModal";
import { useIsMobile } from "@/hooks/useMobile";
import { useDebouncedHover } from "@/hooks/useDebouncedHover";
import PetHoverPreview from "./PetHoverPreview";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
  isClickable?: boolean;
  isEmpty?: boolean;
}

export const DataTable = ({
  columns,
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  isClickable = true,
  isEmpty = false,
}: DataTableProps<PetDto>) => {
  const isMobile = useIsMobile();
  const { sorting, rowSelection, isExportMode, setSorting, setRowSelection } = useTableStore();

  const selectColumn: ColumnDef<PetDto> = useMemo(
    () => ({
      id: "select",
      size: 40,
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="전체 선택"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          className="h-5 w-5"
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          onClick={(e) => e.stopPropagation()}
          aria-label="행 선택"
        />
      ),
    }),
    [],
  );

  const effectiveColumns = useMemo(
    () => (isExportMode ? [selectColumn, ...columns] : columns),
    [isExportMode, selectColumn, columns],
  );

  const queryClient = useQueryClient();
  const router = useAppRouter();
  const [selectedPet, setSelectedPet] = useState<PetDto | null>(null);
  const [hoveredPetId, hoverEnter, hoverLeave] = useDebouncedHover<string>();
  const [previewOverride, setPreviewOverride] = useState<{
    petId: string;
    name?: string;
    status?: string;
  } | null>(null);
  const [previewSuppressed, setPreviewSuppressed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const handleTogglePublic = useCallback(
    async (petId: string, currentIsPublic: boolean) => {
      const newIsPublic = !currentIsPublic;
      patchPetListCache(queryClient, petId, { isPublic: newIsPublic });
      try {
        await petControllerUpdate(petId, { isPublic: newIsPublic });
      } catch {
        patchPetListCache(queryClient, petId, { isPublic: currentIsPublic });
      }
    },
    [queryClient],
  );

  const patchPetDetailCache = useCallback(
    (petId: string, patch: Partial<PetDto>) => {
      queryClient.setQueryData(
        [petControllerFindPetByPetId.name, petId],
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            data: { ...old.data, data: { ...old.data.data, ...patch } },
          };
        },
      );
    },
    [queryClient],
  );

  const handleToggleBreeder = useCallback(
    async (petId: string, currentIsBreeder: boolean) => {
      const newIsBreeder = !currentIsBreeder;
      patchPetListCache(queryClient, petId, { isBreeder: newIsBreeder });
      patchPetDetailCache(petId, { isBreeder: newIsBreeder });
      try {
        await petControllerUpdate(petId, { isBreeder: newIsBreeder });
      } catch {
        patchPetListCache(queryClient, petId, { isBreeder: currentIsBreeder });
        patchPetDetailCache(petId, { isBreeder: currentIsBreeder });
      }
    },
    [queryClient, patchPetDetailCache],
  );

  const handleChangeGrowth = useCallback(
    async (petId: string, currentGrowth: PetDtoGrowth, newGrowth: PetDtoGrowth) => {
      patchPetListCache(queryClient, petId, { growth: newGrowth });
      try {
        await petControllerUpdate(petId, { growth: newGrowth });
      } catch {
        patchPetListCache(queryClient, petId, { growth: currentGrowth });
      }
    },
    [queryClient],
  );

  const handleChangeAdoptionStatus = useCallback(
    async (
      petId: string,
      currentAdoption: AdoptionDto | null | undefined,
      newStatus: UpdateAdoptionDtoStatus | null,
    ) => {
      const oldAdoption = currentAdoption ?? null;
      // 낙관적 업데이트 (adoption 객체는 유지하고 status만 변경)
      const base = oldAdoption ?? { petId, createdAt: new Date().toISOString() };
      const optimisticAdoption = { ...base, status: newStatus };
      patchPetListCache(queryClient, petId, { adoption: optimisticAdoption as PetDto["adoption"] });

      try {
        if (oldAdoption) {
          await petAdoptionControllerUpdatePetAdoption(petId, {
            status: newStatus as UpdateAdoptionDtoStatus,
          });
        } else if (newStatus) {
          await petAdoptionControllerCreatePetAdoption({ petId, status: newStatus });
        }
      } catch {
        // 실패 시 롤백
        patchPetListCache(queryClient, petId, { adoption: oldAdoption as PetDto["adoption"] });
      }
    },
    [queryClient],
  );

  const table = useReactTable({
    data,
    columns: effectiveColumns,
    getRowId: (row) => row.petId,
    enableRowSelection: isExportMode,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    meta: {
      setPreviewOverride,
      setPreviewSuppressed,
      togglePublic: handleTogglePublic,
      toggleBreeder: handleToggleBreeder,
      changeAdoptionStatus: handleChangeAdoptionStatus,
      changeGrowth: handleChangeGrowth,
    },
  });

  const handleRowClick = useCallback(
    ({ e, pet }: { e: React.MouseEvent<HTMLTableRowElement>; pet: PetDto }) => {
      // checkbox, 버튼, 링크 클릭 시에는 row 클릭 이벤트 무시
      if (
        !isClickable ||
        (e.target as HTMLElement).closest("button") ||
        (e.target as HTMLElement).closest('[role="checkbox"]') ||
        (e.target as HTMLElement).closest("a")
      ) {
        return;
      }

      if (isMobile) {
        router.push(`/pet/${pet.petId}`);
      } else {
        setSelectedPet(pet);
      }
    },
    [isClickable, isMobile, router],
  );

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <h1 className="bg-gradient-to-r from-[#4285F4] via-[#9B72CB] to-[#D96570] bg-clip-text text-2xl font-semibold text-transparent dark:from-[#8AB4F8] dark:via-[#C58AF9] dark:to-[#F28B82]">
          개체 관리를 시작해보세요
        </h1>
        <p className="mt-1 text-[15px] text-gray-500 dark:text-gray-400">
          첫 개체를 등록하고 체계적으로 관리할 수 있어요.
        </p>
        <button
          type="button"
          onClick={() => router.push("/register/1")}
          className="focus-visible:ring-ring mt-3 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          개체 등록하기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full" onMouseMove={!isMobile ? handleMouseMove : undefined}>
      <div className="rounded-md">
        <Table className="bg-white dark:bg-[#101012]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const size = header.getSize();
                  return (
                    <TableHead
                      className="font-[400] text-gray-600 dark:text-gray-400"
                      key={header.id}
                      style={size ? { width: size, maxWidth: size } : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              <>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "cursor-pointer",
                      "isPublic" in row.original && row.original.isPublic
                        ? "bg-blue-50/80 hover:bg-blue-100 dark:bg-[#101012] dark:hover:bg-blue-900/30"
                        : "dark:bg-zinc-900 dark:hover:bg-zinc-800",
                    )}
                    onClick={(e) => handleRowClick({ e, pet: row.original })}
                    onMouseEnter={!isMobile ? () => hoverEnter(row.original.petId) : undefined}
                    onMouseLeave={!isMobile ? hoverLeave : undefined}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const size = cell.column.getSize();
                      return (
                        <TableCell
                          key={cell.id}
                          className="py-1.5"
                          style={size ? { width: size, maxWidth: size } : undefined}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
                {/* 무한 스크롤 로더 */}
                {hasMore && (
                  <TableRow ref={loaderRefAction}>
                    <TableCell colSpan={columns.length} className="h-20 text-center">
                      {isFetchingMore ? <Loading /> : null}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      조건에 맞는 개체가 없습니다.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {selectedPet && (
        <PetDetailModal
          isOpen={!!selectedPet}
          pet={selectedPet}
          onClose={() => setSelectedPet(null)}
        />
      )}

      {!previewSuppressed && (previewOverride || hoveredPetId) && (
        <PetHoverPreview
          petId={previewOverride?.petId || hoveredPetId!}
          mousePos={mousePos}
          name={previewOverride?.name}
          parentStatus={previewOverride?.status}
        />
      )}
    </div>
  );
};

export default DataTable;
