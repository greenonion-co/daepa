"use client";

import { Moon, Sun, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Theme } from "@/types/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { SettingsGroup } from "./SettingsGroup";
import { SettingsItem } from "./SettingsItem";

const AppSettingsSection = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const themeOptions: Array<{ key: Theme; label: string; icon: React.ReactNode }> = [
    { key: "light", label: "라이트", icon: <Sun className="h-4 w-4" /> },
    { key: "dark", label: "다크", icon: <Moon className="h-4 w-4" /> },
    { key: "system", label: "시스템", icon: <Smartphone className="h-4 w-4" /> },
  ];

  return (
    <SettingsGroup title="앱 설정">
      <SettingsItem
        icon={
          resolvedTheme === "dark" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )
        }
        iconBgColor={
          resolvedTheme === "dark" ? "bg-indigo-100 dark:bg-indigo-900/30" : "bg-yellow-100"
        }
        iconColor={
          resolvedTheme === "dark"
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-yellow-600"
        }
        label="테마"
        rightElement={
          <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5 dark:bg-neutral-700">
            {themeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setTheme(option.key)}
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  theme === option.key
                    ? "bg-white text-gray-900 shadow-sm dark:bg-neutral-600 dark:text-white"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
                )}
              >
                {option.icon}
                <span className="hidden sm:inline">{option.label}</span>
              </button>
            ))}
          </div>
        }
      />
    </SettingsGroup>
  );
};

export default AppSettingsSection;
