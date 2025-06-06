import { create } from "zustand";
import { FormData, FormStore } from "./pet";

const initialFormData: FormData = {};

export const useEggStore = create<FormStore>((set) => ({
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
