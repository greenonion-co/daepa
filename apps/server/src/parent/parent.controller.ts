import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ParentService } from './parent.service';
import {
  CreateParentDto,
  FindParentDto,
  ParentDto,
  UpdateParentDto,
} from './parent.dto';
import { ApiResponse, ApiParam } from '@nestjs/swagger';

@Controller('/v1/parent')
export class ParentController {
  constructor(private readonly parentService: ParentService) {}

  @Get('/:petId')
  @ApiResponse({
    status: 200,
    description: '부모 관계 조회 성공',
    type: ParentDto,
  })
  async findParent(
    @Param('petId') petId: string,
    @Query() findParentDto: FindParentDto,
  ) {
    return await this.parentService.findOne(petId, findParentDto);
  }

  // TODO: 본인 개체 권한 확인
  @Post('/:petId')
  async createParent(
    @Param('petId') petId: string,
    @Body() createParentDto: CreateParentDto,
  ) {
    await this.parentService.createParent(petId, createParentDto, {
      isDirectApprove: !!createParentDto.isMyPet,
    });
    return {
      success: true,
      message: '부모 관계가 정상적으로 생성되었습니다.',
    };
  }

  @Patch('/update')
  async updateParentRequest(@Body() updateParentDto: UpdateParentDto) {
    const userId = 'ZUCOPIA';
    const { message } = await this.parentService.updateParentStatus({
      myId: userId,
      updateParentDto,
    });
    return {
      success: true,
      message,
    };
  }

  @Delete('delete/:relationId')
  @ApiParam({
    name: 'relationId',
    description: '부모자식 관계 ID (parents 테이블의 id)',
    type: 'number',
    required: true,
  })
  async deleteParent(@Param('relationId') relationId: number) {
    // TODO: 상대방한테도 알림을 줄 것 인가?
    await this.parentService.deleteParent(relationId);
    return {
      success: true,
      message: '부모 관계가 정상적으로 삭제되었습니다.',
    };
  }
}
