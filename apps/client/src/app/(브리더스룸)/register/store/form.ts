import { create } from "zustand";
import { FormData, FormErrors } from "../types";

interface FormStore {
  formData: FormData;
  errors: FormErrors;
  step: number;
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {};

export const useFormStore = create<FormStore>((set) => ({
  formData: initialFormData,
  errors: {},
  step: 0,
  setErrors: (errors) => set({ errors }),
  setStep: (step) => set({ step }),
  setFormData: (data) =>
    set((state) => ({
      formData: typeof data === "function" ? data(state.formData) : data,
    })),
  resetForm: () => set({ formData: initialFormData }),
}));
