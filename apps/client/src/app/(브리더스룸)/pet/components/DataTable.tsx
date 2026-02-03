"use client";

import React, { useState, useCallback } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTableStore from "../store/table";
import { PetDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useAppRouter } from "@/hooks/useAppRouter";
import PetDetailModal from "../[petId]/components/PetDetailModal";
import { useIsMobile } from "@/hooks/useMobile";

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
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();

  const router = useAppRouter();
  const [selectedPet, setSelectedPet] = useState<PetDto | null>(null);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
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

  return (
    <div className="w-full">
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
                        ? "bg-blue-50 hover:bg-blue-100 dark:bg-[#101012] dark:hover:bg-blue-900/30"
                        : "bg-amber-50/50 hover:bg-amber-100 dark:bg-zinc-900 dark:hover:bg-zinc-800",
                    )}
                    onClick={(e) => handleRowClick({ e, pet: row.original })}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const size = cell.column.getSize();
                      return (
                        <TableCell
                          key={cell.id}
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
                <TableCell
                  colSpan={columns.length}
                  onClick={() => {
                    if (!isEmpty) return;

                    router.push("/register/1");
                  }}
                >
                  <div
                    className={cn(
                      "flex h-full w-full flex-col items-center justify-center py-5 text-center text-gray-700 dark:text-gray-300",
                      isEmpty && "cursor-pointer",
                    )}
                  >
                    <Image src="/assets/lizard.png" alt="빈 펫 목록" width={200} height={200} />
                    개체가 없습니다.
                    {isEmpty && (
                      <div className="font-semibold text-blue-500 dark:text-blue-400">
                        개체를 추가해 관리를 시작해보세요!
                      </div>
                    )}
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
    </div>
  );
};

export default DataTable;
