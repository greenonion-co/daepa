import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import { FeedingService } from './feeding.service';
import {
  CreateFeedingDto,
  FeedingBaseDto,
  FeedingDto,
  FeedingFilterDto,
  UpdateFeedingDto,
} from './feeding.dto';
import { JwtUser } from 'src/auth/auth.decorator';
import { JwtUserPayload } from 'src/auth/strategies/jwt.strategy';
import { CommonResponseDto } from 'src/common/response.dto';
import { PageDto, PageMetaDto } from 'src/common/page.dto';

@ApiTags('피딩')
@Controller('v1/feedings')
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  @Post()
  @ApiResponse({
    status: 201,
    description: '피딩 기록이 성공적으로 추가되었습니다.',
    type: CommonResponseDto,
  })
  async create(
    @Body() createFeedingDto: CreateFeedingDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.feedingService.createFeeding(createFeedingDto, token.userId);
    return {
      success: true,
      message: '피딩 기록이 성공적으로 추가되었습니다.',
    };
  }

  @Get()
  @ApiExtraModels(FeedingDto, PageMetaDto)
  @ApiResponse({
    status: 200,
    description: '피딩 기록 목록 조회',
    schema: {
      type: 'object',
      required: ['data', 'meta'],
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FeedingDto) },
        },
        meta: { $ref: getSchemaPath(PageMetaDto) },
      },
    },
  })
  async getList(
    @Query() filterDto: FeedingFilterDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<PageDto<FeedingDto>> {
    return this.feedingService.getFeedingList(
      filterDto.petId,
      token.userId,
      filterDto,
      filterDto.startDate,
      filterDto.endDate,
    );
  }

  @Patch(':id')
  @ApiResponse({
    status: 200,
    description: '피딩 기록이 성공적으로 수정되었습니다.',
    type: CommonResponseDto,
  })
  async update(
    @Param('id') id: number,
    @Body() updateFeedingDto: UpdateFeedingDto,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.feedingService.updateFeeding(id, updateFeedingDto, token.userId);
    return {
      success: true,
      message: '피딩 기록이 성공적으로 수정되었습니다.',
    };
  }

  @Delete(':id')
  @ApiResponse({
    status: 200,
    description: '피딩 기록이 성공적으로 삭제되었습니다.',
    type: CommonResponseDto,
  })
  async delete(
    @Param('id') id: number,
    @JwtUser() token: JwtUserPayload,
  ): Promise<CommonResponseDto> {
    await this.feedingService.deleteFeeding(id, token.userId);
    return {
      success: true,
      message: '피딩 기록이 성공적으로 삭제되었습니다.',
    };
  }
}
