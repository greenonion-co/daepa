"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import Loading from "@/components/common/Loading";

import { overlay } from "overlay-kit";
import AdoptionDetailModal from "./components/AdoptionDetailModal";
import CreateAdoptionModal from "./components/CreateAdoptionModal";
import { getStatusBadge } from "@/lib/utils";

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

  const handleViewAdoption = (adoptionId: string) => {
    overlay.open(({ isOpen, close }) => (
      <AdoptionDetailModal isOpen={isOpen} onClose={close} adoptionId={adoptionId} />
    ));
  };

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

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {adoptions?.map((adoption) => (
          <div
            onClick={() => handleViewAdoption(adoption.adoptionId)}
            key={adoption.adoptionId}
            className="flex cursor-pointer flex-col justify-between rounded-lg border-2 border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
          >
            {/* 영수증 헤더 */}
            <div className="rounded-t-lg border-b border-gray-200 bg-gray-50 px-4 py-3">
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-800">{adoption.pet.name}</h3>
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  {adoption.pet.morphs && adoption.pet.morphs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {adoption.pet.morphs.map((morph: string) => `#${morph}`).join(" ")}
                    </div>
                  )}
                  {adoption.pet.birthdate && (
                    <p>
                      {(() => {
                        const dateStr = adoption.pet.birthdate.toString();
                        const year = dateStr.substring(0, 4);
                        const month = dateStr.substring(4, 6);
                        const day = dateStr.substring(6, 8);
                        return `${year}. ${month}. ${day}`;
                      })()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* 영수증 본문 */}
            <div className="flex flex-1 flex-col justify-between px-4 py-4">
              {/* 상태 배지 */}
              <div>
                <div className="mb-4 flex justify-center">
                  {getStatusBadge(adoption.pet.saleStatus)}
                </div>

                {/* 구매자 정보 */}
                <div className="mb-4 rounded bg-gray-100 p-3">
                  <div className="mb-1 text-sm font-medium text-gray-700">구매자</div>
                  <div className="text-sm text-gray-600">
                    {adoption.buyer ? adoption.buyer.name : "입양자 정보 없음"}
                  </div>
                </div>

                {/* 분양 정보 */}
                <div className="mb-4 space-y-2">
                  {adoption.adoptionDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">분양 날짜</span>
                      <span className="font-medium">
                        {new Date(adoption.adoptionDate).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 총액 */}
              <div>
                {/* 구분선 */}
                <div className="my-4 border-t border-gray-200"></div>

                <div className="mb-4 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-800">분양 가격</span>
                  <span className="text-xl font-bold text-blue-600">
                    {adoption.price ? `${adoption.price.toLocaleString()}원` : "미정"}
                  </span>
                </div>
              </div>
            </div>

            {/* 영수증 푸터 */}
            {adoption?.memo && (
              <div className="rounded-b-lg border-t border-gray-200 bg-gray-50 px-4 py-2 text-center">
                <p className="text-xs text-gray-500">{adoption.memo}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SalesPage;
