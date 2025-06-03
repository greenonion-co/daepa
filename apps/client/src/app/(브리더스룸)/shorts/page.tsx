"use client";

import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { brPetControllerFindAll } from "@repo/api-client";
import { useEffect } from "react";
import Loading from "@/components/common/Loading";
import ShortsCard from "../pet/[petId]/(펫카드)/Shorts";
import { toast } from "sonner";

export default function ShortsPage() {
  const { ref, inView } = useInView();
  const itemPerPage = 10;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [brPetControllerFindAll.name],
    queryFn: ({ pageParam = 1 }) =>
      brPetControllerFindAll({
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
    if (!hasNextPage && inView) {
      toast.info("더 이상 개체가 없습니다.");
    }
  }, [hasNextPage, inView]);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  if (isLoading) return <Loading />;

  return (
    <div
      className="scrollbar-hide fixed inset-0 top-10 snap-y snap-mandatory overflow-y-auto dark:bg-zinc-900"
      style={{ scrollSnapType: "y mandatory" }}
    >
      {data?.map((item, index) => (
        <div
          key={item.petId}
          ref={index === data.length - 1 ? ref : undefined}
          className="relative flex h-screen w-full items-center justify-center"
          style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
        >
          <ShortsCard pet={item} />
        </div>
      ))}
    </div>
  );
}
