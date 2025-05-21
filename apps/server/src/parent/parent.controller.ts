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
  DeleteParentDto,
  FindParentDto,
  ParentDto,
  UpdateParentDto,
} from './parent.dto';
import { ApiResponse } from '@nestjs/swagger';

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
    await this.parentService.createParent(petId, createParentDto);
    return {
      success: true,
      message: '부모 관계가 정상적으로 생성되었습니다.',
    };
  }

  @Patch('/:petId')
  async updateParentStatus(
    @Param('petId') petId: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    await this.parentService.updateParentStatus(petId, updateParentDto);
    return {
      success: true,
      message: '부모 관계가 정상적으로 수정되었습니다.',
    };
  }

  @Delete('/:petId')
  async deleteParent(
    @Param('petId') petId: string,
    @Body() deleteParentDto: DeleteParentDto,
  ) {
    await this.parentService.deleteParent(petId, deleteParentDto);
    return {
      success: true,
      message: '부모 관계가 정상적으로 삭제되었습니다.',
    };
  }
}
