import { UserProfilePublicDto, AdoptionDtoStatus, PetAdoptionDtoMethod } from "@repo/api-client";

export interface AdoptionEditFormDto {
  price?: number;
  memo?: string;
  method?: PetAdoptionDtoMethod;
  adoptionDate?: string;
  status?: AdoptionDtoStatus;
  petId: string;
  adoptionId?: string;
  buyer?: UserProfilePublicDto;
}
