import { PetSummaryDto, PetDto, UserNotificationDto, EggDto } from "@repo/api-client";
import { create } from "zustand";

export type NotificationDetailJson = {
  receiverPet: PetDto | PetSummaryDto | EggDto;
  senderPet: PetDto | PetSummaryDto | EggDto;
};

export type NotificationDetail = UserNotificationDto & { detailJson?: NotificationDetailJson };
interface NotiStore {
  selected: NotificationDetail | null;
  setSelected: (selected: NotificationDetail | null) => void;
}

export const useNotiStore = create<NotiStore>((set) => ({
  selected: null,
  setSelected: (selected) => set({ selected }),
}));
