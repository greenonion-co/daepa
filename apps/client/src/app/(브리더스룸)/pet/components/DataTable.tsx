"use client";

import React, { useEffect, useRef } from "react";
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
import { RefreshCcw } from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  totalCount?: number;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  loaderRefAction: (node?: Element | null) => void;
  hasFilter?: boolean;
  isClickable?: boolean;
  refetch: () => Promise<unknown> | void;
}

export const DataTable = ({
  columns,
  data,
  totalCount = 0,
  hasMore,
  isFetchingMore,
  loaderRefAction,
  hasFilter = true,
  isClickable = true,
  refetch,
}: DataTableProps<PetDto>) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();

  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

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
        {hasFilter && <Filters />}

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
          className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gray-600 hover:bg-blue-100 hover:text-blue-700"
        >
          검색된 펫・{totalCount}마리
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>

        <div className="rounded-md">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead className="font-[400] text-gray-600" key={header.id}>
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
                          ? "bg-blue-100 hover:bg-blue-200 dark:bg-gray-800 dark:hover:bg-blue-800/20"
                          : "opacity-80 hover:opacity-100 dark:opacity-40 dark:hover:opacity-100",
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
