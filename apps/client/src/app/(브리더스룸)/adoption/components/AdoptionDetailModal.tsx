"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStatusBadge } from "@/lib/utils";
import Loading from "@/components/common/Loading";
import { useQueryClient } from "@tanstack/react-query";
import { adoptionControllerGetAllAdoptions } from "@repo/api-client";
import { useAdoptionDetail } from "../hooks/useAdoptionDetail";
import { AdoptionDetailContent } from "./AdoptionDetailContent";

/**
 * 분양 상세 정보 모달 Props
 */
export interface AdoptionDetailModalProps {
  /** 모달 열림 상태 */
  isOpen: boolean;
  /** 조회할 펫 ID */
  petId: string;
  /** 모달 닫기 콜백 */
  onClose: () => void;
  /** 업데이트 성공 시 콜백 (선택) - 커스텀 갱신 로직이 필요한 경우 */
  onUpdateSuccess?: () => void;
}

/**
 * 분양 상세 정보 모달
 *
 * @description
 * - Single Responsibility: 모달 UI + 자체 데이터 관리만 담당
 * - Open/Closed: onUpdateSuccess로 확장 가능
 * - Dependency Inversion: 기본 갱신 로직 제공, 필요시 주입 가능
 *
 * @example
 * ```tsx
 * // 기본 사용 (자동 갱신)
 * <AdoptionDetailModal
 *   isOpen={true}
 *   petId="123"
 *   onClose={() => {}}
 * />
 *
 * // 커스텀 갱신
 * <AdoptionDetailModal
 *   isOpen={true}
 *   petId="123"
 *   onClose={() => {}}
 *   onUpdateSuccess={() => {
 *     // 커스텀 갱신 로직
 *   }}
 * />
 * ```
 */
const AdoptionDetailModal = ({
  isOpen,
  petId,
  onClose,
  onUpdateSuccess,
}: AdoptionDetailModalProps) => {
  const queryClient = useQueryClient();
  const { data: adoptionData, isLoading, error } = useAdoptionDetail(petId, isOpen);

  /**
   * 분양 정보 업데이트 성공 핸들러
   * - 기본: 분양 목록 캐시 무효화
   * - 커스텀: onUpdateSuccess 콜백 실행
   */
  const handleUpdateSuccess = () => {
    if (onUpdateSuccess) {
      // 상위에서 제공한 커스텀 갱신 로직 실행
      onUpdateSuccess();
    } else {
      // 기본 동작: 분양 목록 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: [adoptionControllerGetAllAdoptions.name],
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              분양 상세 정보
              {adoptionData?.status && getStatusBadge(adoptionData.status)}
            </div>
          </DialogTitle>
        </DialogHeader>

        {isLoading && <Loading />}
        {error && <div>Error: {error.message}</div>}

        {adoptionData && (
          <AdoptionDetailContent
            adoptionData={adoptionData}
            onUpdateSuccess={handleUpdateSuccess}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdoptionDetailModal;
