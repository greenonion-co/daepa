import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { EggService } from './egg.service';
import { CreateEggDto } from './egg.dto';
import { nanoid } from 'nanoid';
import { isMySQLError } from 'src/common/error';

@Controller('/v1/egg')
export class EggController {
  constructor(private readonly eggService: EggService) {}

  @Post()
  async create(@Body() createEggDto: CreateEggDto) {
    // TODO: userId를 ownerId로 사용
    const tempOwnerId = 'ADMIN';
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      const eggId = nanoid(8);
      try {
        await this.eggService.createEgg({
          ...createEggDto,
          eggId,
          ownerId: tempOwnerId,
        });
        return {
          success: true,
          message: '알 등록이 완료되었습니다. eggId: ' + eggId,
        };
      } catch (error: unknown) {
        if (isMySQLError(error)) {
          if (error.code === 'ER_DUP_ENTRY') {
            const response = {
              statusCode: HttpStatus.CONFLICT,
              message: '',
            };
            if (error.message.includes('UNIQUE_CLUTCH')) {
              response.message =
                '이미 존재하는 클러치 정보입니다. 부모, 해칭일, 클러치 정보를 확인해주세요.';
              throw new HttpException(response, HttpStatus.CONFLICT);
            }
            if (error.message.includes('UNIQUE_EGG_ID')) {
              attempts++;
              if (attempts >= maxRetries) {
                response.message =
                  '알 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
                throw new HttpException(response, HttpStatus.CONFLICT);
              }
              continue;
            }
          }
          throw error;
        }
        throw error;
      }
    }
  }
}
