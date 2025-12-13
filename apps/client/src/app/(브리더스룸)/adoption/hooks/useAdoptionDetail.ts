import { useQuery } from "@tanstack/react-query";
import { adoptionControllerGetAdoptionByPetId } from "@repo/api-client";

/**
 * 펫의 분양 정보를 조회하는 커스텀 훅
 *
 * @description
 * - 단일 책임 원칙(SRP): 데이터 페칭 로직만 담당
 * - 의존성 역전 원칙(DIP): API 호출을 추상화하여 UI 컴포넌트가 데이터 소스에 직접 의존하지 않도록 함
 *
 * @param petId - 조회할 펫의 ID
 * @param enabled - 쿼리 활성화 여부 (기본값: true)
 *
 * @returns {object} 분양 정보 쿼리 결과
 * - data: 분양 정보 데이터
 * - isLoading: 로딩 상태
 * - error: 에러 정보
 * - refetch: 데이터 재조회 함수
 */
export const useAdoptionDetail = (petId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: [adoptionControllerGetAdoptionByPetId.name, petId],
    queryFn: () => adoptionControllerGetAdoptionByPetId(petId, { includeInactive: "true" }),
    enabled: !!petId && enabled,
    select: (data) => data.data?.data,
  });
};
