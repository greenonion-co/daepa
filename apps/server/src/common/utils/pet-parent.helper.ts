import { PetParentDto } from '../../pet/pet.dto';
import { PET_HIDDEN_STATUS } from '../../pet/pet.constants';
import { PARENT_STATUS } from '../../parent_request/parent_request.constants';
import { SiblingPetDetailDto } from '../../pet_relation/pet_relation.dto';

/**
 * 상태별 부모 펫 노출 정보
 * @param parentPet - 부모 펫 정보
 * @param childPetOwnerId - 자식 펫의 소유자 ID
 * @param viewerId - 현재 조회자 ID
 * @returns 조회 권한에 따라 부모 펫 정보, 숨김 상태, 또는 null 반환
 * @private
 */
export function replaceParentPublicSafe(
  parentPet: PetParentDto | null,
  childPetOwnerId: string | null,
  viewerId?: string,
) {
  // 부모 펫이 없으면 null 반환
  if (!parentPet) return null;

  const isViewingMyPet = childPetOwnerId === viewerId; // 내 펫을 보고 있는가?
  const isViewingMyPetAndParentPetMine =
    isViewingMyPet && parentPet.owner.userId === viewerId; // 내 펫을 보고 있으면서, 부모 펫도 내 펫인가?

  if (isViewingMyPet) {
    if (!parentPet.isPublic && !isViewingMyPetAndParentPetMine) {
      return {
        petId: parentPet.petId,
        hiddenStatus: PET_HIDDEN_STATUS.SECRET,
      };
    }

    return parentPet;
  }

  if (parentPet.status === PARENT_STATUS.APPROVED) {
    if (!parentPet.isPublic) {
      return {
        petId: parentPet.petId,
        hiddenStatus: PET_HIDDEN_STATUS.SECRET,
      };
    }

    return parentPet;
  }

  // 그 외의 경우 (거절됨, 취소됨 등) null 반환
  return null;
}

/**
 * 형제 펫 공개 여부에 따른 노출 정보 처리
 * @param sibling - 형제 펫 정보
 * @param viewerId - 현재 조회자 ID
 * @returns 조회 권한에 따라 형제 펫 정보 또는 숨김 상태 반환
 */
export function replaceSiblingPublicSafe(
  sibling: SiblingPetDetailDto,
  viewerId?: string,
) {
  const isOwner = sibling.owner?.userId === viewerId;

  // 공개 펫이거나 내 펫이면 전체 정보 반환
  if (sibling.isPublic || isOwner) {
    return sibling;
  }

  // 비공개 + 남의 펫이면 숨김 처리
  return {
    petId: sibling.petId,
    hiddenStatus: PET_HIDDEN_STATUS.SECRET,
  };
}
