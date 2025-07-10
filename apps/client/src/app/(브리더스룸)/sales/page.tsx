"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Plus } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";

import { overlay } from "overlay-kit";
import AdoptionDetailModal from "./components/AdoptionDetailModal";
import CreateAdoptionModal from "./components/CreateAdoptionModal";

const SalesPage = () => {
  const queryClient = useQueryClient();

  const { data: adoptions, isLoading } = useQuery({
    queryKey: [adoptionControllerGetAllAdoptions.name],
    queryFn: () =>
      adoptionControllerGetAllAdoptions({
        page: 1,
        itemPerPage: 50,
        order: "DESC",
      }),
    select: (data) => data.data.data,
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500">대기 중</Badge>;
      case "CONFIRMED":
        return <Badge className="bg-blue-500">확정</Badge>;
      case "COMPLETED":
        return <Badge className="bg-green-500">완료</Badge>;
      case "CANCELLED":
        return <Badge className="bg-red-500">취소</Badge>;
      default:
        return <Badge variant="outline">알 수 없음</Badge>;
    }
  };

  const handleViewAdoption = (adoptionId: string) => {
    overlay.open(({ isOpen, close, unmount }) => (
      <AdoptionDetailModal
        isOpen={isOpen}
        onClose={close}
        adoptionId={adoptionId}
        onUnmount={unmount}
      />
    ));
  };

  const handleCreateAdoption = () => {
    overlay.open(({ isOpen, close, unmount }) => (
      <CreateAdoptionModal
        isOpen={isOpen}
        onClose={close}
        onUnmount={unmount}
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

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adoptions?.map((adoption) => (
          <Card key={adoption.adoptionId} className="transition-shadow hover:shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">분양 #{adoption.adoptionId.slice(-6)}</CardTitle>
                {getStatusBadge(adoption.status)}
              </div>
              <div className="text-muted-foreground text-sm">
                {adoption.seller.name} • {adoption.buyer ? adoption.buyer.name : "입양자 없음"}
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-3">
                {adoption.price && (
                  <div className="mb-2">
                    <span className="text-sm font-medium">분양 가격:</span>
                    <span className="ml-2 text-sm">{adoption.price.toLocaleString()}원</span>
                  </div>
                )}
                {adoption.adoptionDate && (
                  <div className="mb-2">
                    <span className="text-sm font-medium">분양 날짜:</span>
                    <span className="ml-2 text-sm">
                      {new Date(adoption.adoptionDate).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewAdoption(adoption.adoptionId)}
                  className="flex-1"
                >
                  <Eye className="mr-1 h-4 w-4" />
                  상세 보기
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SalesPage;
