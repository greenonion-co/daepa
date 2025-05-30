import { PetSummaryDto } from "@/types/pet";
import { PetParentDto } from "@repo/api-client";

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
  | "father"
  | "mother";

export type FormStep = {
  title: string;
  field: {
    name: FieldName;
    type: string;
    required?: boolean;
    info?: string;
    unit?: string;
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
  photos?: any[];
  foods?: string[];
  fatherId?: string;
  motherId?: string;
  father?: PetParentDto & { message: string };
  mother?: PetParentDto & { message: string };
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
