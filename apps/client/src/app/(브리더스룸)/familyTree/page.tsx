"use client";

import React, { useEffect } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp } from "lucide-react";
import { PetWithChildrenCard } from "./components/PetWithChildrenCard";
import { useInView } from "react-intersection-observer";
import { useInfiniteQuery } from "@tanstack/react-query";
import { petControllerGetPetsWithChildren } from "@repo/api-client";

const FamilyTreePage = () => {
  const { ref, inView } = useInView();

  const itemPerPage = 10;

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: [petControllerGetPetsWithChildren.name],
    queryFn: ({ pageParam = 1 }) =>
      petControllerGetPetsWithChildren({
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

  const totalChildren = data?.reduce((sum, pet) => sum + (pet.childrenCount || 0), 0) || 0;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-muted h-32 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      {/* 헤더 섹션 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">가족관계도</h1>
            <p className="text-muted-foreground">가족관계도를 확인하세요</p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="flex items-center gap-2">
              <Users className="h-4 w-4" />총 {data?.length || 0}마리
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              자식 {totalChildren}마리
            </Badge>
          </div>
        </div>
      </div>

      {/* 개체 목록 */}
      <div className="space-y-4" ref={ref}>
        {data?.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="py-12 text-center">
                <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-medium">자식이 있는 개체가 없습니다</h3>
                <p className="text-muted-foreground">
                  {data?.length === 0
                    ? "현재 자식이 있는 개체가 없습니다."
                    : "검색 조건에 맞는 개체가 없습니다."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          data?.map((pet) => <PetWithChildrenCard key={pet.parent.petId} pet={pet} />)
        )}
      </div>
    </div>
  );
};

export default FamilyTreePage;
