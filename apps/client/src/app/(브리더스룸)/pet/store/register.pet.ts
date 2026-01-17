import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BaseFormStore, createFormStore } from "./base";

export const useRegisterPetStore = create<BaseFormStore>()(
  persist(createFormStore(), {
    name: "register-pet-storage",
  }),
);
