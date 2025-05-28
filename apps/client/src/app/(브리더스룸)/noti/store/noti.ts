import { UserNotificationDto } from "@repo/api-client";
import { create } from "zustand";

interface NotiStore {
  selected: UserNotificationDto | null;
  setSelected: (selected: UserNotificationDto | null) => void;
}

export const useNotiStore = create<NotiStore>((set) => ({
  selected: null,
  setSelected: (selected) => set({ selected }),
}));
