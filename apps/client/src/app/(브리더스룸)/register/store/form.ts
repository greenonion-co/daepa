import { create } from "zustand";
import { FormData, FormErrors } from "../types";

interface FormStore {
  formData: FormData;
  errors: FormErrors;
  step: number;
  showMorphResetAlert: boolean;
  selectedSpecies: string | null;
  setErrors: (errors: FormErrors) => void;
  setStep: (step: number) => void;
  setShowMorphResetAlert: (show: boolean) => void;
  setSelectedSpecies: (species: string | null) => void;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {};

export const useFormStore = create<FormStore>((set) => ({
  formData: initialFormData,
  errors: {},
  step: 0,
  showMorphResetAlert: false,
  selectedSpecies: null,
  setErrors: (errors) => set({ errors }),
  setStep: (step) => set({ step }),
  setShowMorphResetAlert: (show) => set({ showMorphResetAlert: show }),
  setSelectedSpecies: (species) => set({ selectedSpecies: species }),
  setFormData: (data) =>
    set((state) => ({
      formData: typeof data === "function" ? data(state.formData) : data,
    })),
  resetForm: () => set({ formData: initialFormData }),
}));
