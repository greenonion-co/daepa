export type FieldName =
  | "species"
  | "morph"
  | "size"
  | "gender"
  | "parentSearch"
  | "name"
  | "birthDate"
  | "weight"
  | "description"
  | "images"
  | "photo";

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
  morph?: string[];
  size?: string;
  gender?: string;
  parentSearch?: any;
  name?: string;
  birthDate?: string;
  weight?: string;
  description?: string;
  images?: string[];
  photo?: string[];
}

export interface FormErrors {
  [key: string]: string;
}

export interface SelectorConfig {
  title: string;
  selectList: string[];
}
