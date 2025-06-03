import { create } from "zustand";
import { FormErrors } from "../types";
import { PetDto, PetDtoSpecies, UserDto } from "@repo/api-client";

export interface FormData extends Omit<PetDto, "petId" | "owner" | "name" | "species"> {
  petId?: string;
  owner?: UserDto;
  name?: string;
  species?: PetDtoSpecies;
}
interface FormStore {
  formData: FormData;
  errors: FormErrors;
  step: number;
  page: "register" | "detail";
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setPage: (page: "register" | "detail") => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {};

export const useFormStore = create<FormStore>((set) => ({
  formData: initialFormData,
  errors: {},
  page: "register",
  step: 0,
  setErrors: (errors) => set({ errors }),
  setStep: (step) => set({ step }),
  setPage: (page) => set({ page }),
  setFormData: (data) =>
    set((state) => ({
      formData: typeof data === "function" ? data(state.formData) : data,
    })),
  resetForm: () => set({ formData: initialFormData, errors: {}, step: 0 }),
}));
