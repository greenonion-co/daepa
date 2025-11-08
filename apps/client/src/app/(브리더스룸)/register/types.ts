export type FieldName =
  | "petId"
  | "species"
  | "morphs"
  | "traits"
  | "growth"
  | "sex"
  | "name"
  | "foods"
  | "hatchingDate"
  | "weight"
  | "desc"
  | "photos"
  | "father"
  | "mother"
  | "clutchCount"
  | "clutchOrder"
  | "clutch"
  | "parents"
  | "layingDate"
  | "status"
  | "isPublic"
  | "eggStatus"
  | "temperature"
  | "adoption"
  | "adoption.price";

export type PhotoItem = {
  fileName: string;
  size: number;
  mimeType: string;
  url: string;
};

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

export interface FormErrors {
  [key: string]: string;
}

export interface SelectorConfig {
  title: string;
  selectList: string[];
}

export enum DUPLICATE_CHECK_STATUS {
  NONE = "none",
  CHECKING = "checking",
  AVAILABLE = "available",
  DUPLICATE = "duplicate",
}
