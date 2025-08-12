"use client";

import * as React from "react";
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
import { adoptionControllerGetAllAdoptions, AdoptionDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import { overlay } from "overlay-kit";
import AdoptionDetailModal from "./AdoptionDetailModal";
import useTableStore from "../../pet/store/table";
import { useQueryClient } from "@tanstack/react-query";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data?: TData[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
}

export const DataTable = ({
  columns,
  data = [],
  hasMore,
  isFetchingMore,
  loaderRefAction,
}: DataTableProps<AdoptionDto>) => {
  const queryClient = useQueryClient();
  const {
    sorting,
    columnFilters,
    columnVisibility,
    rowSelection,
    setSorting,
    setColumnFilters,
    setColumnVisibility,
    setRowSelection,
  } = useTableStore();

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleRowClick = ({
    e,
    adoptionId,
  }: {
    e: React.MouseEvent<HTMLTableRowElement>;
    adoptionId: string;
  }) => {
    // checkbox나 버튼 클릭 시에는 detail 모달을 열지 않음
    if (
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[role="checkbox"]')
    ) {
      return;
    }

    overlay.open(({ isOpen, close }) => (
      <AdoptionDetailModal
        isOpen={isOpen}
        onClose={close}
        adoptionId={adoptionId}
        onUpdate={() => {
          queryClient.invalidateQueries({
            queryKey: [adoptionControllerGetAllAdoptions.name],
          });
        }}
      />
    ));
  };

  return (
    <div className="relative w-full">
      <div className="w-full">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={(e) => handleRowClick({ e, adoptionId: row.original.adoptionId })}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {/* 무한 스크롤 로더 */}
                  {hasMore && (
                    <TableRow ref={loaderRefAction}>
                      <TableCell colSpan={columns.length} className="h-20 text-center">
                        {isFetchingMore ? (
                          <div className="flex items-center justify-center">
                            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                          </div>
                        ) : (
                          <Loading />
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    분양 정보가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
