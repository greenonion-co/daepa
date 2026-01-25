import { useMemo } from "react";
import { useUserStore } from "@/app/(브리더스룸)/store/user";

/**
 * 현재 조회하고 있는 펫이 로그인한 사용자의 펫인지 확인하는 커스텀 훅
 *
 * @param ownerId - 펫 소유자의 userId (선택적)
 * @returns 사용자의 펫이면 true, 아니면 false
 *
 * @example
 * ```tsx
 * const MyPetComponent = ({ pet }: { pet: PetDto }) => {
 *   const isMyPet = useIsMyPet(pet.owner?.userId);
 *
 *   return (
 *     <div>
 *       {isMyPet ? (
 *         <button>편집하기</button>
 *       ) : (
 *         <span>다른 사용자의 펫입니다</span>
 *       )}
 *     </div>
 *   );
 * };
 * ```
 */
export function useIsMyPet(ownerId: string | undefined): boolean {
  const { user } = useUserStore();

  return useMemo(() => {
    // 사용자가 로그인하지 않았거나 소유자 ID가 없으면 false
    if (!user || !ownerId) {
      return false;
    }

    // 사용자 ID와 펫 소유자 ID 비교
    return user.userId === ownerId;
  }, [user, ownerId]);
}
