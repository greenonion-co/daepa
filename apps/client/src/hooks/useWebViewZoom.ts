import { useEffect } from "react";

type WindowWithZoom = Window & {
  __setAllowZoom?: (allow: boolean) => void;
};

/**
 * 앱 WebView에서 핀치 줌을 허용/비허용하는 훅
 * @param enabled - true면 줌 허용, false면 줌 비허용
 */
export function useWebViewZoom(enabled: boolean) {
  useEffect(() => {
    const win = window as WindowWithZoom;
    win.__setAllowZoom?.(enabled);

    return () => {
      win.__setAllowZoom?.(false);
    };
  }, [enabled]);
}
