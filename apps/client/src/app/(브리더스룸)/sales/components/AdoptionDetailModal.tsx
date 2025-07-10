"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  adoptionControllerConfirmAdoption,
  adoptionControllerGetAdoptionByAdoptionId,
  PetDtoSpecies,
} from "@repo/api-client";
import { SPECIES_KOREAN_INFO } from "../../constants";

interface AdoptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  adoptionId: string;
  onUnmount: () => void;
}

const AdoptionDetailModal = ({
  isOpen,
  onClose,
  adoptionId,
  onUnmount,
}: AdoptionDetailModalProps) => {
  const { data: adoptionData, isLoading: isAdoptionLoading } = useQuery({
    queryKey: [adoptionControllerGetAdoptionByAdoptionId.name, adoptionId],
    queryFn: () => adoptionControllerGetAdoptionByAdoptionId(adoptionId),
    select: (data) => data.data,
  });

  const pet = adoptionData?.pet;

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "대기 중",
          color: "bg-yellow-500",
        };
      case "CONFIRMED":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "확정",
          color: "bg-blue-500",
        };
      case "COMPLETED":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          label: "완료",
          color: "bg-green-500",
        };
      case "CANCELLED":
        return {
          icon: <XCircle className="h-4 w-4" />,
          label: "취소",
          color: "bg-red-500",
        };
      default:
        return {
          icon: <Clock className="h-4 w-4" />,
          label: "대기 중",
          color: "bg-yellow-500",
        };
    }
  };

  const handleConfirmAdoption = async () => {
    try {
      await adoptionControllerConfirmAdoption(adoptionId);
      toast.success("분양이 확정되었습니다.");
      onClose();
    } catch (error) {
      toast.error("분양 확정에 실패했습니다.");
    }
  };

  const handleCompleteAdoption = async () => {
    try {
      // TODO: API 호출
      // await adoptionControllerComplete(adoption.adoptionId);
      toast.success("분양이 완료되었습니다.");
      onClose();
    } catch (error) {
      toast.error("분양 완료에 실패했습니다.");
    } finally {
    }
  };

  const handleCancelAdoption = async () => {
    try {
      // TODO: API 호출
      // await adoptionControllerCancel(adoption.adoptionId);
      toast.success("분양이 취소되었습니다.");
      onClose();
    } catch (error) {
      toast.error("분양 취소에 실패했습니다.");
    } finally {
    }
  };

  const statusInfo = getStatusInfo(adoptionData?.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>분양 상세 정보</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 펫 정보 */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="mb-2 font-semibold">{pet?.name}</h3>
            <div className="text-muted-foreground text-sm">
              {SPECIES_KOREAN_INFO[pet?.species as PetDtoSpecies]}
            </div>
          </div>

          {/* 분양 정보 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">상태</span>
              <Badge className={statusInfo.color}>
                {statusInfo.icon}
                <span className="ml-1">{statusInfo.label}</span>
              </Badge>
            </div>

            {adoptionData?.price && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">분양 가격</span>
                <span className="text-sm">{adoptionData.price.toLocaleString()}원</span>
              </div>
            )}

            {adoptionData?.adoptionDate && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">분양 날짜</span>
                <span className="text-sm">
                  {format(adoptionData.adoptionDate, "PPP", { locale: ko })}
                </span>
              </div>
            )}

            {adoptionData?.location && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">거래 장소</span>
                <span className="text-sm">
                  {adoptionData.location === "offline" ? "오프라인" : "온라인"}
                </span>
              </div>
            )}

            {adoptionData?.memo && (
              <div>
                <span className="text-sm font-medium">메모</span>
                <p className="text-muted-foreground mt-1 text-sm">{adoptionData.memo}</p>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          {adoptionData?.status === "PENDING" && (
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleCancelAdoption}
                disabled={isAdoptionLoading}
                className="flex-1"
              >
                취소
              </Button>
              <Button
                onClick={handleConfirmAdoption}
                disabled={isAdoptionLoading}
                className="flex-1"
              >
                확정
              </Button>
            </div>
          )}

          {adoptionData?.status === "CONFIRMED" && (
            <div className="pt-4">
              <Button
                onClick={handleCompleteAdoption}
                disabled={isAdoptionLoading}
                className="w-full"
              >
                완료
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
