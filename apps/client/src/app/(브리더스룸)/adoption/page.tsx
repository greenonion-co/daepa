"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";

import { overlay } from "overlay-kit";

import CreateAdoptionModal from "./components/CreateAdoptionModal";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";

const AdoptionPage = () => {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [adoptionControllerGetAllAdoptions.name],
    queryFn: ({ pageParam = 1 }) =>
      adoptionControllerGetAllAdoptions({
        page: pageParam,
        itemPerPage,
        order: "DESC",
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
      <CreateAdoptionModal
        isOpen={isOpen}
        onClose={close}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: [adoptionControllerGetAllAdoptions.name] });
          toast.success("분양이 성공적으로 생성되었습니다.");
        }}
      />
    ));
  };

  if (isLoading) return <Loading />;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">분양룸</h1>
          <Button onClick={handleCreateAdoption} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            분양 추가
          </Button>
        </div>
        <p className="text-muted-foreground">내 분양 정보를 관리하세요</p>
      </div>

      <DataTable
        columns={columns}
        data={data ?? []}
        hasMore={hasNextPage}
        isFetchingMore={isFetchingNextPage}
        loaderRefAction={ref}
      />
    </div>
  );
};

export default AdoptionPage;
