import { UserProfilePublicDto, AdoptionDtoStatus, PetAdoptionDtoLocation } from "@repo/api-client";

export interface AdoptionEditFormDto {
  price?: number;
  memo?: string;
  location?: PetAdoptionDtoLocation;
  adoptionDate?: string;
  status?: AdoptionDtoStatus;
  petId: string;
  adoptionId?: string;
  buyer?: UserProfilePublicDto;
}
