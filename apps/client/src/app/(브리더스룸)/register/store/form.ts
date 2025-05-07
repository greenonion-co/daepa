import { create } from "zustand";
import { FormData } from "../types";

interface FormStore {
  formData: FormData;
  setFormData: (data: FormData | ((prev: FormData) => FormData)) => void;
  resetForm: () => void;
}

const initialFormData: FormData = {};

export const useFormStore = create<FormStore>((set) => ({
  formData: initialFormData,
  setFormData: (data) =>
    set((state) => ({
      formData: typeof data === "function" ? data(state.formData) : data,
    })),
  resetForm: () => set({ formData: initialFormData }),
}));
