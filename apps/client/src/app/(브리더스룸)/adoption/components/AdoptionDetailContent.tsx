import { PetAdoptionDtoStatus, AdoptionDto } from "@repo/api-client";
import { PetInfoCard } from "./PetInfoCard";
import EditAdoptionForm from "./EditAdoptionForm";
import AdoptionReceipt from "../../pet/[petId]/(펫카드)/components/AdoptionReceipt";

/**
 * 분양 상세 정보 컨텐츠 Props
 */
export interface AdoptionDetailContentProps {
  /** 분양 데이터 */
  adoptionData: AdoptionDto;
  /** 업데이트 성공 시 콜백 */
  onUpdateSuccess: () => void;
  /** 닫기 콜백 */
  onClose: () => void;
}

/**
 * 분양 상세 정보 컨텐츠
 *
 * @description
 * - Single Responsibility: 레이아웃과 조건부 렌더링만 담당
 * - 판매 완료: AdoptionReceipt (읽기 전용)
 * - 그 외: EditAdoptionForm (편집 가능)
 *
 * @example
 * ```tsx
 * <AdoptionDetailContent
 *   adoptionData={data}
 *   onUpdateSuccess={() => console.log('갱신')}
 *   onClose={() => console.log('닫기')}
 * />
 * ```
 */
export const AdoptionDetailContent = ({
  adoptionData,
  onUpdateSuccess,
  onClose,
}: AdoptionDetailContentProps) => {
  const petSummary = adoptionData?.pet;

  if (!petSummary) {
    return null;
  }

  const { status } = adoptionData;
  const isSold = status === PetAdoptionDtoStatus.SOLD;
  const { name, species, hatchingDate, sex, morphs, traits } = petSummary;

  /**
   * 폼 제출 핸들러
   * - updated가 true면 데이터 갱신 후 닫기
   * - false면 닫기만
   */
  const handleSubmit = (updated: boolean = true) => {
    if (updated) {
      onUpdateSuccess(); // 상위에서 갱신 처리
    }
    onClose();
  };

  return (
    <div className="space-y-4">
      {/* 펫 정보 카드 */}
      <PetInfoCard
        petId={adoptionData.petId}
        name={name}
        species={species}
        sex={sex}
        morphs={morphs}
        traits={traits}
        hatchingDate={hatchingDate}
        isSold={isSold}
        onClose={onClose}
      />

      {/* 분양 상태에 따른 뷰 */}
      <div className="space-y-3">
        {isSold ? (
          // 판매완료: 읽기 전용 영수증
          <AdoptionReceipt adoption={adoptionData} isEditable={false} />
        ) : (
          // 그 외: 편집 가능한 폼
          <EditAdoptionForm
            adoptionData={adoptionData}
            onSubmit={handleSubmit}
            onCancel={onClose}
          />
        )}
      </div>
    </div>
  );
};
