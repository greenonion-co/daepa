import { Body, Controller, Param, Post } from '@nestjs/common';
import { PetService } from 'src/pet/pet.service';
import { DeleteParentDto, UpdateParentDto } from './parent.dto';

@Controller('/v1/parent')
export class ParentController {
  constructor(private readonly petService: PetService) {}

  // TODO: 본인 개체 권한 확인
  @Post('/update/:petId')
  async createParent(
    @Param('petId') petId: string,
    @Body() updateParentDto: UpdateParentDto,
  ) {
    await this.petService.updateParentId({
      petId,
      parentId: updateParentDto.parentId,
      target: updateParentDto.target,
    });
    return {
      success: true,
      message: '부모 정보가 정상적으로 등록되었습니다.',
    };
  }

  @Post('/delete/:petId')
  async deleteParent(
    @Param('petId') petId: string,
    @Body() deleteParentDto: DeleteParentDto,
  ) {
    await this.petService.deleteParent(petId, deleteParentDto.target);
    return {
      success: true,
      message: '부모 정보가 정상적으로 삭제되었습니다.',
    };
  }
}
