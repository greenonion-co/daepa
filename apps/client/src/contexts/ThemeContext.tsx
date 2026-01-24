"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Theme } from "@/types/theme";
import { isNativeApp, requestSetTheme } from "@/lib/native-bridge";

interface ThemeContextType {
  theme: Theme; // 사용자 설정값 (light/dark/system)
  resolvedTheme: "light" | "dark"; // 실제 적용되는 테마
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
}

// 시스템 테마 가져오기
const getSystemTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // 실제 적용할 테마 계산
  const computeResolvedTheme = (t: Theme): "light" | "dark" => {
    if (t === "system") {
      return getSystemTheme();
    }
    return t;
  };

  useEffect(() => {
    setMounted(true);

    // 로컬 스토리지에서 저장된 테마 확인
    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme && (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system")) {
      setTheme(savedTheme);
      setResolvedTheme(computeResolvedTheme(savedTheme));
    } else {
      // 저장된 테마가 없으면 system 기본값
      setTheme("system");
      setResolvedTheme(getSystemTheme());
    }
  }, []);

  // 시스템 테마 변경 감지 리스너
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // system 모드일 때만 시스템 테마 변경에 반응
      if (theme === "system") {
        setResolvedTheme(getSystemTheme());
      }
    };

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, [mounted, theme]);

  // resolvedTheme 변경 시 DOM과 네이티브 앱에 적용
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");

    // 네이티브 앱에 테마 동기화
    if (isNativeApp()) {
      requestSetTheme(resolvedTheme);
    }
  }, [resolvedTheme, mounted]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    setResolvedTheme(computeResolvedTheme(newTheme));
    localStorage.setItem("theme", newTheme);
  };

  const toggleTheme = () => {
    const newTheme = resolvedTheme === "light" ? "dark" : "light";
    handleSetTheme(newTheme);
  };

  // mounted 체크로 hydration 불일치 방지
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: handleSetTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
