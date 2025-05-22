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
import { SearchFilter } from "./SearchFilter";
import useTableStore from "../store/table";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Add from "@mui/icons-material/Add";
import { PetDto } from "@repo/api-client";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
}

export const DataTable = ({
  columns,
  data,
  hasMore,
  isFetchingMore,
  loaderRefAction,
}: DataTableProps<PetDto>) => {
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

  const router = useRouter();

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

  const handleRowClick = ({ e, id }: { e: React.MouseEvent<HTMLTableRowElement>; id: string }) => {
    // checkbox나 버튼 클릭 시에는 detail 페이지로 이동하지 않음
    if (
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
        <SearchFilter table={table} />
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
                      className="cursor-pointer"
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
                          "더 불러오는 중..."
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

      <Button
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-blue-500 shadow-lg hover:bg-blue-600"
        onClick={() => router.push("/register/1")}
      >
        <Add fontSize="large" />
      </Button>
    </div>
  );
};

export default DataTable;
