"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { columns } from "./components/columns";
import DataTable from "./components/DataTable";
import { brPetControllerFindAll } from "@repo/api-client";
import { useInView } from "react-intersection-observer";
import { useEffect } from "react";
import Loading from "@/components/common/Loading";

export default function PetPage() {
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brPetControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
        page: pageParam,
        itemPerPage,
        order: "ASC",
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.meta.hasNextPage) {
        return lastPage.data.meta.page + 1;
      }
      return undefined;
    },
  });

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  // 모든 페이지의 데이터를 하나의 배열로 합치기
  const allPets = data?.pages.flatMap((page) => page.data.data) ?? [];

  return (
    <div className="container mx-auto py-10">
      <DataTable
        columns={columns}
        data={allPets}
        hasMore={hasNextPage}
        isFetchingMore={isFetchingNextPage}
        loaderRefAction={ref}
      />
    </div>
  );
}
