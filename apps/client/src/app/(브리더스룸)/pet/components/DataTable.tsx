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
import Link from "next/link";
import SearchInput from "../../components/SearchInput";
import { useIsMobile } from "@/hooks/useMobile";
import { useSearchKeywordStore } from "../../store/searchKeyword";
import Image from "next/image";

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
  isEmpty?: boolean;
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
  isEmpty = false,
}: DataTableProps<PetDto>) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();
  const { setSearchKeyword } = useSearchKeywordStore();

  const isMobile = useIsMobile();

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
    <div className="w-full">
      <div className="px-2">
        {hasFilter && <Filters />}
        {isMobile && (
          <SearchInput
            placeholder="펫 이름으로 검색하세요"
            onKeyDown={(value) => setSearchKeyword(value)}
          />
        )}
      </div>

      <div className="mb-2 flex justify-between">
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
          className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 text-[12px] text-gray-600 hover:bg-blue-100 hover:text-blue-700 dark:text-gray-400 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
        >
          검색된 펫・{totalCount}마리
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>

        <Link href="/pet/deleted">
          <button
            type="button"
            className="h-[32px] cursor-pointer rounded-lg px-3 text-sm text-red-600 underline hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30"
          >
            삭제된 펫 보기
          </button>
        </Link>
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="font-[400] text-gray-600 dark:text-gray-400"
                      key={header.id}
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
    </div>
  );
};

export default DataTable;
