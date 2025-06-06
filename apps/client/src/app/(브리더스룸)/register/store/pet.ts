import { create } from "zustand";
import { FieldName, FormErrors } from "../types";

export type FormData = Partial<Record<FieldName, any>>;
export interface FormStore {
  formData: FormData;
  step: number;
  page: "register" | "detail";
  errors: FormErrors;
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setPage: (page: "register" | "detail") => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {};

export const usePetStore = create<FormStore>((set) => ({
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
