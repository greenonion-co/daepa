import { useState, useRef, useCallback, useEffect } from "react";

/**
 * 호버 상태에 디바운스를 적용하는 훅.
 * enter: delay(ms) 후에 값 설정 (같은 값이면 타이머 재설정 안 함)
 * leave: 즉시 null로 초기화
 */
export function useDebouncedHover<T = string>(delay = 200) {
  const [value, setValue] = useState<T | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingRef = useRef<T | null>(null);

  const enter = useCallback(
    (v: T) => {
      if (pendingRef.current === v) return;
      pendingRef.current = v;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setValue(v), delay);
    },
    [delay],
  );

  const leave = useCallback(() => {
    pendingRef.current = null;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setValue(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return [value, enter, leave] as const;
}
