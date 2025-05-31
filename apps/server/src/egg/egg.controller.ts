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
  CreateEggHatchDto,
  EggDto,
  UpdateEggDto,
} from './egg.dto';
import { ExcludeNilInterceptor } from 'src/interceptors/exclude-nil';
import { ApiResponse } from '@nestjs/swagger';

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
  async create(@Body() createEggDto: CreateEggDto) {
    // TODO: userId를 ownerId로 사용
    const tempOwnerId = 'ADMIN';

    const createdEggs = await this.eggService.createEgg({
      ...createEggDto,
      ownerId: tempOwnerId,
    });

    return {
      success: true,
      message:
        '알 등록이 완료되었습니다. eggIds: ' +
        createdEggs.map((egg) => egg.eggId).join(', '),
    };
  }

  @Patch(':eggId')
  async update(
    @Param('eggId') eggId: string,
    @Body() updateEggDto: UpdateEggDto,
  ) {
    await this.eggService.updateEgg(eggId, updateEggDto);
    return {
      success: true,
      message: '알 수정이 완료되었습니다. eggId: ' + eggId,
    };
  }

  @Delete(':eggId')
  async delete(@Param('eggId') eggId: string) {
    await this.eggService.deleteEgg(eggId);
    return {
      success: true,
      message: '알 삭제가 완료되었습니다. eggId: ' + eggId,
    };
  }

  @Post(':eggId/hatch')
  async hatch(
    @Param('eggId') eggId: string,
    @Body() createEggHatchDto: CreateEggHatchDto,
  ) {
    const tempOwnerId = 'ADMIN';
    const { petId } = await this.eggService.convertEggToPet(
      eggId,
      tempOwnerId,
      createEggHatchDto,
    );
    return {
      success: true,
      message: '알이 펫으로 전환되었습니다. petId: ' + petId,
    };
  }
}
