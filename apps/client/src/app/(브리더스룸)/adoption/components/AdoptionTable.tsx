import { useCallback, useEffect, useRef, useState } from "react";
import useTableStore from "../../pet/store/table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CircleAlert, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import Loading from "@/components/common/Loading";
import AdoptionReceiptModal from "./AdoptionReceiptModal";
import { useInView } from "react-intersection-observer";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { AdoptionFilters } from "./AdoptionFilters";
import { columns } from "./adoption_columns";
import { adoptionHistoryControllerGetAllAdoptions } from "@repo/api-client";
import { useIsMobile } from "@/hooks/useMobile";
import PetHoverPreview from "../../pet/components/PetHoverPreview";

const AdoptionTable = () => {
  const { ref, inView } = useInView();
  const { searchFilters } = useAdoptionFilterStore();
  const itemPerPage = 10;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();

  const isMobile = useIsMobile();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredPetId, setHoveredPetId] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: [adoptionHistoryControllerGetAllAdoptions.name, searchFilters],
      queryFn: ({ pageParam = 1 }) =>
        adoptionHistoryControllerGetAllAdoptions({
          page: pageParam,
          itemPerPage,
          order: "DESC",
          ...searchFilters,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) => {
        if (lastPage.data.meta.hasNextPage) {
          return lastPage.data.meta.page + 1;
        }
        return undefined;
      },
      select: (data) => data.pages.flatMap((page) => page.data.data),
    });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  const table = useReactTable({
    data: data ?? [],
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

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isLoading) return <Loading />;

  return (
    <div className="relative w-full" onMouseMove={!isMobile ? handleMouseMove : undefined}>
      <div className="flex items-center gap-2 pb-1 pl-2">
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
          분양 정보 ・{data?.length ?? "?"}개
          <RefreshCcw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </button>
        <span className="text-[11px] text-blue-600">분양 완료된 펫만 표시됩니다</span>
      </div>

      <AdoptionFilters />

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
                      "hover:bg-purple-50 dark:bg-[#18171C] dark:hover:bg-purple-900/30",
                    )}
                    onMouseEnter={!isMobile ? () => setHoveredPetId(row.original.petId) : undefined}
                    onMouseLeave={!isMobile ? () => setHoveredPetId(null) : undefined}
                    onClick={() => {
                      overlay.open(({ isOpen, close }) => (
                        <AdoptionReceiptModal
                          isOpen={isOpen}
                          onClose={close}
                          adoption={row.original}
                        />
                      ));
                    }}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {/* 무한 스크롤 로더 */}
                {hasNextPage && (
                  <TableRow ref={ref}>
                    <TableCell colSpan={columns.length} className="h-20 text-center">
                      {isFetchingNextPage && <Loading />}
                    </TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="flex h-full w-full flex-col items-center justify-center py-5 text-center text-gray-700">
                    <CircleAlert className={"my-4 opacity-40"} width={60} height={60} />
                    분양 정보가 없습니다.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {hoveredPetId && <PetHoverPreview petId={hoveredPetId} mousePos={mousePos} />}
    </div>
  );
};

export default AdoptionTable;
