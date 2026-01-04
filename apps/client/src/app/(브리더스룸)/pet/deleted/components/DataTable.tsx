"use client";

import React, { useEffect, useRef } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
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
import { DeletedPetDto } from "@repo/api-client";
import Loading from "@/components/common/Loading";
import { cn } from "@/lib/utils";
import { RefreshCcw } from "lucide-react";

interface DataTableProps {
  columns: ColumnDef<DeletedPetDto>[];
  data: DeletedPetDto[];
  totalCount?: number;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
  refetch: () => Promise<unknown> | void;
}

export default function DataTable({
  columns,
  data,
  totalCount = 0,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  refetch,
}: DataTableProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      <div className="w-full">
        <button
          type="button"
          aria-label="검색 결과 새로고침"
          aria-busy={isRefreshing}
          disabled={isRefreshing}
          onClick={async () => {
            if (isRefreshing) return;
            setIsRefreshing(true);
            try {
              await refetch();
            } finally {
              timeoutRef.current = setTimeout(() => setIsRefreshing(false), 500);
            }
          }}
          className="mb-2 flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        >
          삭제된 펫・{totalCount}마리
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>

        <div className="rounded-md border dark:border-gray-700">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead className="font-[400] text-gray-600 dark:text-gray-400" key={header.id}>
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
                      className="bg-gray-50 opacity-70 hover:bg-gray-100 hover:opacity-100 dark:bg-gray-800/50 dark:hover:bg-gray-700"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {hasMore && (
                    <TableRow ref={loaderRefAction}>
                      <TableCell colSpan={columns.length} className="h-24 text-center">
                        {isFetchingMore ? <Loading /> : null}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    결과 없음
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
