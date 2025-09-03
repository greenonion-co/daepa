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
import { Filters } from "./Filters";
import useTableStore from "../store/table";
import { useRouter } from "next/navigation";
import { PetDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import { cn } from "@/lib/utils";
import { useFilterStore } from "../../store/filter";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
  hasFilter?: boolean;
  isClickable?: boolean;
}

export const DataTable = ({
  columns,
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  hasFilter = true,
  isClickable = true,
}: DataTableProps<PetDto>) => {
  const { columnFilters } = useFilterStore();
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();

  const router = useRouter();

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
      columnVisibility: columnFilters,
    },
  });

  const handleRowClick = ({ e, id }: { e: React.MouseEvent<HTMLTableRowElement>; id: string }) => {
    // checkbox나 버튼 클릭 시에는 detail 페이지로 이동하지 않음
    if (
      !isClickable ||
      (e.target as HTMLElement).closest("button") ||
      (e.target as HTMLElement).closest('[role="checkbox"]')
    ) {
      return;
    }
    router.push(`/pet/${id}`);
  };

  return (
    <div className="relative w-full">
      <div className="w-full">
        {hasFilter && <Filters table={table} />}

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
                      className={cn(
                        "cursor-pointer",
                        "isPublic" in row.original && row.original.isPublic
                          ? "bg-blue-100 hover:bg-blue-200 dark:bg-gray-800 dark:hover:bg-blue-800"
                          : "opacity-60 hover:opacity-100 dark:opacity-40 dark:hover:opacity-100",
                      )}
                      onClick={(e) => handleRowClick({ e, id: row.original.petId })}
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
                    개체가 없습니다.
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
