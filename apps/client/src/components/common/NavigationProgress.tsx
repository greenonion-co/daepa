"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

// 외부에서 프로그레스 바를 시작할 수 있는 함수 (router.push 전에 호출)
const listeners = new Set<() => void>();
export function startProgress() {
  listeners.forEach((fn) => fn());
}

export default function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const start = useCallback(() => {
    setLoading(true);
    setProgress(30);
  }, []);

  // startProgress() 호출 구독
  useEffect(() => {
    listeners.add(start);
    return () => {
      listeners.delete(start);
    };
  }, [start]);

  // <Link> 클릭 감지
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || anchor.target === "_blank")
        return;
      if (href !== pathname) start();
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [pathname, start]);

  // pathname 변경 시 완료
  useEffect(() => {
    if (!loading) return;
    setProgress(100);
    const timeout = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // 로딩 중 프로그레스 애니메이션
  useEffect(() => {
    if (loading && progress < 90) {
      intervalRef.current = setInterval(() => {
        setProgress((p) => Math.min(p + (90 - p) * 0.08, 90));
      }, 300);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [loading, progress]);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed left-0 right-0 top-0 z-[9999] h-[3px]">
      <div
        className="h-full bg-[#247DFE]"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transition: "width 300ms ease-out, opacity 200ms ease-out 200ms",
        }}
      />
    </div>
  );
}
