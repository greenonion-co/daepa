import { UserEntity } from 'src/user/user.entity';
import { USER_ROLE } from 'src/user/user.constant';
import { DEFAULT_PET_LIMIT_BY_ROLE } from './pet.constants';

/**
 * 공개 펫 슬롯 한도 정책.
 *
 * 결제 플랜 도입 시에도 호출부(PetService 등)는 변경하지 않고
 * 이 함수의 우선순위 로직만 확장한다.
 *
 * 우선순위 (현재):
 *   1) 관리자 override (UserEntity.petLimitOverride)
 *   2) role 기본값 (DEFAULT_PET_LIMIT_BY_ROLE)
 *
 * 결제 도입 시 추가될 우선순위 (예시):
 *   1) 관리자 override
 *   2) 활성 결제 플랜의 한도
 *   3) role 기본값
 */
export class PetLimitPolicy {
  static compute(user: Pick<UserEntity, 'role' | 'petLimitOverride'>): number {
    if (user.petLimitOverride != null) {
      return user.petLimitOverride;
    }
    return (
      DEFAULT_PET_LIMIT_BY_ROLE[user.role] ??
      DEFAULT_PET_LIMIT_BY_ROLE[USER_ROLE.USER]
    );
  }
}
