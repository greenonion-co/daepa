import { toast as sonnerToast } from "sonner";
import { isNativeApp, requestToast } from "./native-bridge";

type ToastOptions = Parameters<typeof sonnerToast>[1];

/**
 * 네이티브 앱에서는 네이티브 Toast를 사용하고,
 * 웹에서는 sonner Toast를 사용하는 래퍼
 */
export const toast = {
  success: (message: string, options?: ToastOptions) => {
    if (isNativeApp()) {
      requestToast(message, "success");
    } else {
      sonnerToast.success(message, options);
    }
  },

  error: (message: string, options?: ToastOptions) => {
    if (isNativeApp()) {
      requestToast(message, "error");
    } else {
      sonnerToast.error(message, options);
    }
  },

  info: (message: string, options?: ToastOptions) => {
    if (isNativeApp()) {
      requestToast(message, "info");
    } else {
      sonnerToast.info(message, options);
    }
  },

  warning: (message: string, options?: ToastOptions) => {
    if (isNativeApp()) {
      requestToast(message, "warning");
    } else {
      sonnerToast.warning(message, options);
    }
  },

  // 기본 toast (메시지만)
  message: (message: string, options?: ToastOptions) => {
    if (isNativeApp()) {
      requestToast(message, "info");
    } else {
      sonnerToast(message, options);
    }
  },
};
