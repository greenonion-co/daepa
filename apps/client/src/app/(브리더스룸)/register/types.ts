import { PetSummaryDto } from "@/types/pet";

export type FieldName =
  | "species"
  | "morphs"
  | "traits"
  | "growth"
  | "sex"
  | "name"
  | "foods"
  | "birthdate"
  | "weight"
  | "desc"
  | "photos"
  | "parents";

export type FormStep = {
  title: string;
  field: {
    name: FieldName;
    type: string;
    required?: boolean;
    placeholder?: string;
    validation?: (value: string) => boolean;
  };
};

export interface FormData {
  species?: string;
  morphs?: string[];
  traits?: string[];
  growth?: string;
  sex?: "M" | "F" | "N";
  name?: string;
  birthdate?: string;
  weight?: number;
  desc?: string;
  photo?: any[];
  foods?: string[];
  fatherId?: string;
  motherId?: string;
  father?: PetSummaryDto;
  mother?: PetSummaryDto;
  petId?: string;
  ownerId?: string;
}

export interface FormErrors {
  [key: string]: string;
}

export interface SelectorConfig {
  title: string;
  selectList: string[];
}
