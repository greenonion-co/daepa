"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Plus, BarChart3, PackageSearch } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useInView } from "react-intersection-observer";
import { useEffect, useState } from "react";

import { overlay } from "overlay-kit";

import EditAdoptionModal from "./components/EditAdoptionModal";
import AdoptionDashboard from "./components/AdoptionDashboard";
import { columns } from "./components/columns";
import AdoptionDataTable from "./components/AdoptionDataTable";
import { useAdoptionFilterStore } from "../store/adoptionFilter";
import { Card } from "@/components/ui/card";

const AdoptionPage = () => {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const itemPerPage = 10;
  const [showDashboard, setShowDashboard] = useState(false);
  const { searchFilters } = useAdoptionFilterStore();
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
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

  const handleCreateAdoption = () => {
    overlay.open(({ isOpen, close }) => (
      <EditAdoptionModal
        isOpen={isOpen}
        onClose={close}
        adoptionData={data}
        onSuccess={() => {
          close();
          queryClient.invalidateQueries({ queryKey: [adoptionControllerGetAllAdoptions.name] });
          toast.success("분양이 성공적으로 생성되었습니다.");
        }}
      />
    ));
  };

  if (isLoading) return <Loading />;

  if (data && data.length === 0 && Object.keys(searchFilters).length === 0)
    return (
      <div className="container mx-auto p-6">
        <Card
          onClick={handleCreateAdoption}
          className="flex cursor-pointer flex-col items-center justify-center bg-blue-50 p-10 hover:bg-blue-100"
        >
          <PackageSearch className="h-10 w-10 text-blue-500" />
          <div className="text-center text-gray-600">
            분양 정보를
            <span className="text-blue-500">추가</span>하여
            <div className="font-semibold text-blue-500">간편한 관리를 시작해보세요!</div>
          </div>
        </Card>
      </div>
    );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-6 pb-6">
        <h1 className="text-2xl font-bold">분양룸</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowDashboard(!showDashboard)}
            className="flex items-center gap-2"
          >
            <BarChart3 />
            {showDashboard ? "목록 보기" : "대시보드"}
          </Button>
          <Button onClick={handleCreateAdoption} className="flex items-center gap-2">
            <Plus />
            분양 추가
          </Button>
        </div>
      </div>

      {showDashboard ? (
        <AdoptionDashboard data={data} />
      ) : (
        <AdoptionDataTable
          columns={columns}
          data={data}
          hasMore={hasNextPage}
          isFetchingMore={isFetchingNextPage}
          loaderRefAction={ref}
        />
      )}
    </div>
  );
};

export default AdoptionPage;
