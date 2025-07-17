import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { EggService } from './egg.service';
import {
  CreateEggDto,
  EggDto,
  HatchedResponseDto,
  UpdateEggDto,
} from './egg.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { ApiResponse } from '@nestjs/swagger';
import { CommonResponseDto } from 'src/common/response.dto';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { JwtUser } from 'src/auth/auth.decorator';

@Controller('/v1/egg')
@UseInterceptors(ExcludeNilInterceptor)
export class EggController {
  constructor(private readonly eggService: EggService) {}

  @Get(':eggId')
  @ApiResponse({
    status: 200,
    description: '알 정보 조회 성공',
    type: EggDto,
  })
  async findOne(@Param('eggId') eggId: string) {
    return await this.eggService.getEgg(eggId);
  }

  @Post()
  @ApiResponse({
    status: 200,
    description: '알 등록 성공',
    type: CommonResponseDto,
  })
  async create(
    @Body() createEggDto: CreateEggDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    const createdEggs = await this.eggService.createEgg({
      ...createEggDto,
      ownerId: token.userId,
    });

    return {
      success: true,
      message:
        '알 등록이 완료되었습니다. eggIds: ' +
        createdEggs.map((egg) => egg.eggId).join(', '),
    };
  }

  @Patch(':eggId')
  @ApiResponse({
    status: 200,
    description: '알 수정 성공',
    type: CommonResponseDto,
  })
  async update(
    @Param('eggId') eggId: string,
    @Body() updateEggDto: UpdateEggDto,
    @JwtUser() token: JwtUserPayload,
  ) {
    await this.eggService.updateEgg(token.userId, eggId, updateEggDto);
    return {
      success: true,
      message: '알 수정이 완료되었습니다. eggId: ' + eggId,
    };
  }

  @Delete(':eggId')
  @ApiResponse({
    status: 200,
    description: '알 삭제 성공',
    type: CommonResponseDto,
  })
  async delete(@Param('eggId') eggId: string) {
    await this.eggService.deleteEgg(eggId);
    return {
      success: true,
      message: '알 삭제가 완료되었습니다. eggId: ' + eggId,
    };
  }

  @Get(':eggId/hatched')
  @ApiResponse({
    status: 200,
    description: '알 펫 전환 성공',
    type: HatchedResponseDto,
  })
  async hatched(
    @Param('eggId') eggId: string,
    @JwtUser() token: JwtUserPayload,
  ) {
    const { petId } = await this.eggService.convertEggToPet(
      eggId,
      token.userId,
    );
    return {
      success: true,
      message: '알이 펫으로 전환되었습니다.',
      hatchedPetId: petId,
    };
  }
}
