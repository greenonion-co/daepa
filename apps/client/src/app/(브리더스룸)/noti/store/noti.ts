import { DetailJson } from "@/types/pet";
import { UserNotificationDto } from "@repo/api-client";
import { create } from "zustand";

// UserNotificationDto 타입 확장
export interface ExtendedUserNotificationDto extends Omit<UserNotificationDto, "detailJson"> {
  detailJson: DetailJson;
}

interface NotiStore {
  selected: ExtendedUserNotificationDto | null;
  setSelected: (selected: ExtendedUserNotificationDto | null) => void;
}

export const useNotiStore = create<NotiStore>((set) => ({
  selected: null,
  setSelected: (selected) => set({ selected }),
}));
