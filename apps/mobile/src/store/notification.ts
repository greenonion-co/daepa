import { create } from 'zustand';

interface NotificationData {
  title: string;
  body: string;
  notificationId?: string;
  data?: Record<string, unknown>;
}

interface NotificationStore {
  // 포그라운드 배너 표시용
  visible: boolean;
  notification: NotificationData | null;
  showNotification: (notification: NotificationData) => void;
  hideNotification: () => void;
  // 백그라운드 알림 클릭 시 네비게이션용
  pendingNotificationId: string | null;
  setPendingNotificationId: (id: string | null) => void;
  clearPendingNotificationId: () => void;
  // 푸시 알림 data.path 가 있으면 그 경로의 webview를 열기 위해 사용
  pendingDeepLinkPath: string | null;
  setPendingDeepLinkPath: (path: string | null) => void;
  clearPendingDeepLinkPath: () => void;
}

export const useNotificationStore = create<NotificationStore>(set => ({
  visible: false,
  notification: null,
  showNotification: notification => {
    set({ visible: true, notification });
  },
  hideNotification: () => {
    set({ visible: false, notification: null });
  },
  pendingNotificationId: null,
  setPendingNotificationId: id => {
    set({ pendingNotificationId: id });
  },
  clearPendingNotificationId: () => {
    set({ pendingNotificationId: null });
  },
  pendingDeepLinkPath: null,
  setPendingDeepLinkPath: path => {
    set({ pendingDeepLinkPath: path });
  },
  clearPendingDeepLinkPath: () => {
    set({ pendingDeepLinkPath: null });
  },
}));
