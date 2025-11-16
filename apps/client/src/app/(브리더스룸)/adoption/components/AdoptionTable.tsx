import { useEffect, useRef, useState } from "react";
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
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { overlay } from "overlay-kit";
import Loading from "@/components/common/Loading";
import EditAdoptionModal from "./EditAdoptionModal";
import { toast } from "sonner";
import AdoptionDetailModal from "./AdoptionDetailModal";
import { useInView } from "react-intersection-observer";
import { useAdoptionFilterStore } from "../../store/adoptionFilter";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { PackageSearch } from "lucide-react";
import { columns } from "./columns";

const AdoptionTable = () => {
  const { ref, inView } = useInView();
  const { searchFilters } = useAdoptionFilterStore();
  const itemPerPage = 10;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { sorting, rowSelection, setSorting, setRowSelection } = useTableStore();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useInfiniteQuery({
      queryKey: [adoptionControllerGetAllAdoptions.name, searchFilters],
      queryFn: ({ pageParam = 1 }) =>
        adoptionControllerGetAllAdoptions({
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

  const handleCreateAdoption = () => {
    overlay.open(({ isOpen, close }) => (
      <EditAdoptionModal
        isOpen={isOpen}
        onClose={close}
        adoptionData={data}
        onSuccess={() => {
          close();
          refetch();
          toast.success("분양이 성공적으로 생성되었습니다.");
        }}
      />
    ));
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (isLoading) return <Loading />;

  if (!data?.length && Object.keys(searchFilters).length === 0)
    return (
      <div className="container mx-auto p-6">
        <Card
          onClick={handleCreateAdoption}
          className="flex cursor-pointer flex-col items-center justify-center bg-blue-50 p-10 hover:bg-blue-100"
        >
          <PackageSearch className="h-10 w-10 text-blue-500" />
          <div className="text-center text-gray-600">
            분양 정보를
            <span className="text-blue-500">&nbsp;추가</span>하여
            <div className="font-semibold text-blue-500">간편한 관리를 시작해보세요!</div>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="relative w-full">
      <div className="w-full">
        {/* 헤더 영역 */}
        <div className={cn("flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100")}>
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[14px] font-[500] text-blue-600">
            +
          </div>
          <div
            onClick={handleCreateAdoption}
            className="flex cursor-pointer items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600"
          >
            분양 정보 추가하기
          </div>
        </div>

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

        {/* 분양룸 필터만들기 */}
        {/* <Filters /> */}

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
                        "bg-purple-50 hover:bg-purple-100 dark:bg-gray-800 dark:hover:bg-purple-800/20",
                      )}
                      onClick={() => {
                        overlay.open(({ isOpen, close }) => (
                          <AdoptionDetailModal
                            isOpen={isOpen}
                            onClose={close}
                            petId={row.original.petId}
                            onUpdate={refetch}
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
                        {isFetchingNextPage ? (
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

export default AdoptionTable;
