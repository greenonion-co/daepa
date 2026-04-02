export type FormFieldName =
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
  | "isBreeder"
  | "eggStatus"
  | "temperature"
  | "adoption"
  | "adoption.price";

export type FormStep = {
  title: string;
  field: {
    name: FormFieldName;
    type: string;
    required?: boolean;
    info?: string;
    unit?: string;
    placeholder?: string;
    validation?: (value: string) => boolean;
  };
};

export interface BaseFormErrors {
  [key: string]: string;
}
