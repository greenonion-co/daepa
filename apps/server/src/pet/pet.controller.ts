import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { CreatePetDto } from './pet.dto';
import { PetService } from './pet.service';
import { nanoid } from 'nanoid';

// MySQL 에러를 위한 커스텀 클래스
class MySQLError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

// 타입 가드 함수
function isMySQLError(error: unknown): error is MySQLError {
  return (
    error instanceof MySQLError ||
    (error instanceof Error &&
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      typeof error.code === 'string')
  );
}

@Controller('/v1/pet')
export class PetController {
  constructor(private readonly petService: PetService) {}

  @Get()
  async findAll() {
    // 유저의 모든 펫 정보를 조회
    return await this.petService.getAllPets();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.petService.getPet(id);
  }

  @Post()
  async create(@Body() createPetDto: CreatePetDto) {
    console.log(createPetDto);
    // TODO: userId를 owner_id에 저장
    const tempOwnerId = 'ADMIN';
    const maxRetries = 3;
    let attempts = 0;

    while (attempts < maxRetries) {
      const petId = nanoid(8);
      try {
        return await this.petService.createPet({
          ...createPetDto,
          petId,
          ownerId: tempOwnerId,
        });
      } catch (error: unknown) {
        if (isMySQLError(error)) {
          if (error.code === 'ER_DUP_ENTRY') {
            const response = {
              statusCode: HttpStatus.CONFLICT,
              message: '',
            };
            if (error.message.includes('UNIQUE_OWNER_PET_NAME')) {
              // 중복 펫 이름 처리
              response.message = '이미 존재하는 펫 이름입니다.';
              throw new HttpException(response, HttpStatus.CONFLICT);
            }
            if (error.message.includes('UNIQUE_PET_ID')) {
              // 중복 펫 아이디인 경우 재시도
              attempts++;
              if (attempts >= maxRetries) {
                response.message =
                  '펫 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
                throw new HttpException(response, HttpStatus.CONFLICT);
              }
              continue; // 다음 시도 진행
            }
          }
          throw error;
        }
        throw error;
      }
    }
  }
}
