import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreatePetDto, UpdatePetDto } from './pet.dto';
import { PetService } from './pet.service';
import { nanoid } from 'nanoid';
import { PetEntity } from './pet.entity';
import { PageOptionsDto, PageDto } from 'src/common/page.dto';

class MySQLError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
  }
}

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
  async findAll(
    @Query() pageOptionsDto: PageOptionsDto,
  ): Promise<PageDto<PetEntity>> {
    return await this.petService.getAllPets(pageOptionsDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.petService.getPet(id);
  }

  @Post()
  async create(@Body() createPetDto: CreatePetDto) {
    // TODO: userId를 ownerId로 사용
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
              response.message = '이미 존재하는 펫 이름입니다.';
              throw new HttpException(response, HttpStatus.CONFLICT);
            }
            if (error.message.includes('UNIQUE_PET_ID')) {
              attempts++;
              if (attempts >= maxRetries) {
                response.message =
                  '펫 아이디 생성 중 오류가 발생했습니다. 나중에 다시 시도해주세요.';
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

  @Patch()
  async update(
    @Body()
    updatePetDto: UpdatePetDto,
  ) {
    return await this.petService.updatePet(updatePetDto);
  }

  @Delete()
  async delete(@Body('petId') petId: string) {
    return await this.petService.deletePet(petId);
  }
}
