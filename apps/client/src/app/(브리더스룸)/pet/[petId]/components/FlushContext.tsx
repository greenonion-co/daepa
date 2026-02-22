"use client";

import { createContext, useCallback, useContext, useEffect, useRef } from "react";

type FlushCallback = () => void;

const FlushContext = createContext<React.MutableRefObject<FlushCallback[]> | null>(null);

/**
 * 모달이 닫히기 직전에 호출되는 flush 콜백을 등록합니다.
 * 미저장 상태를 저장하는 용도로 사용됩니다.
 */
export function useRegisterFlush(callback: FlushCallback) {
  const ref = useContext(FlushContext);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!ref) return;
    const cb = () => callbackRef.current();
    ref.current.push(cb);
    return () => {
      ref.current = ref.current.filter((c) => c !== cb);
    };
  }, [ref]);
}

/**
 * PetDetailModal에서 사용: flush ref + provider + flushAll 유틸을 반환합니다.
 */
export function useFlush() {
  const flushRef = useRef<FlushCallback[]>([]);

  const flushAll = useCallback(() => {
    flushRef.current.forEach((cb) => cb());
  }, []);

  return { flushRef, flushAll, FlushProvider: FlushContext.Provider };
}
