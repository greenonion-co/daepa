import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiParam, ApiResponse } from '@nestjs/swagger';
import { Roles, RolesGuard } from 'src/common/decorators/roles.decorator';
import { USER_ROLE } from '../user.constant';
import { UserService } from '../user.service';
import { PetService } from 'src/pet/pet.service';
import { PetLimitPolicy } from 'src/pet/pet-limit.policy';
import {
  UpdatePetLimitOverrideDto,
  UpdatePetLimitOverrideResponseDto,
} from './admin.user.dto';

@Controller('/v1/admin/user')
@Roles(USER_ROLE.ADMIN)
@UseGuards(RolesGuard)
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly petService: PetService,
  ) {}

  /**
   * 사용자별 공개 펫 슬롯 한도 override.
   *
   * - body.petLimitOverride === null  → override 해제 (role 기본값으로 복귀)
   * - body.petLimitOverride === 0     → 해당 사용자는 새로운 펫을 공개할 수 없음
   * - body.petLimitOverride > 0       → 해당 값으로 한도 고정
   *
   * 한도가 축소되어 현재 공개 펫 수가 새 한도를 초과하면,
   * 가장 최근 등록된 펫부터 자동으로 비공개 처리한다 (silent demote).
   * 강등된 펫 ID 목록은 응답에 포함된다.
   */
  @Patch(':userId/pet-limit')
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '펫 한도 override 변경 성공',
    type: UpdatePetLimitOverrideResponseDto,
  })
  @ApiResponse({ status: 403, description: '관리자 권한이 필요합니다.' })
  @ApiResponse({ status: 404, description: '사용자를 찾을 수 없습니다.' })
  async updatePetLimitOverride(
    @Param('userId') userId: string,
    @Body() dto: UpdatePetLimitOverrideDto,
  ): Promise<UpdatePetLimitOverrideResponseDto> {
    const updatedUser = await this.userService.updatePetLimitOverride(
      userId,
      dto.petLimitOverride,
    );

    // 한도 축소로 초과된 공개 펫이 있으면 silent demote
    const demotedPetIds = await this.petService.enforcePetLimitForUser(userId);

    return {
      success: true,
      message: '펫 한도가 변경되었습니다.',
      effectiveLimit: PetLimitPolicy.compute(updatedUser),
      demotedPetIds,
    };
  }
}
