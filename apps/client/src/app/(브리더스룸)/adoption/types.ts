import { AdoptionDtoStatus, PetAdoptionDtoLocation, UserProfilePublicDto } from "@repo/api-client";

export interface AdoptionEditFormDto {
  price?: number;
  memo?: string;
  location?: PetAdoptionDtoLocation;
  buyerId?: string;
  adoptionDate?: string;
  status?: AdoptionDtoStatus;
  petId: string;
  adoptionId?: string;
  buyer?: UserProfilePublicDto;
}
