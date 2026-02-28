import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsItemProps {
  icon?: React.ReactNode;
  iconColor?: string;
  iconBgColor?: string;
  label: string;
  value?: string | React.ReactNode;
  onClick?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  isDestructive?: boolean;
  disabled?: boolean;
}

export const SettingsItem = ({
  icon,
  iconColor,
  iconBgColor,
  label,
  value,
  onClick,
  rightElement,
  showChevron = false,
  isDestructive = false,
  disabled = false,
}: SettingsItemProps) => {
  const content = (
    <>
      {icon &&
        (iconBgColor ? (
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              iconBgColor,
              iconColor,
            )}
          >
            {icon}
          </div>
        ) : (
          <div className={cn("flex h-8 w-8 items-center justify-center", iconColor)}>{icon}</div>
        ))}
      <div className="">
        <span
          className={cn(
            "text-[15px] whitespace-nowrap",
            isDestructive ? "text-red-600 dark:text-red-400" : "text-gray-900 dark:text-white",
          )}
        >
          {label}
        </span>
      </div>
      <div className="ml-auto flex min-w-0 items-center gap-3">
        {typeof value === "string" && (
          <p className="truncate text-[13px] font-[600] text-gray-700 dark:text-gray-400">
            {value}
          </p>
        )}
        {typeof value !== "string" && value}
        {rightElement && <div className="shrink-0">{rightElement}</div>}
        {showChevron && <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />}
      </div>
    </>
  );

  const className = cn(
    "flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-b-0 dark:border-neutral-700",
    onClick && !disabled && "active:bg-gray-50 dark:active:bg-neutral-700",
    disabled && "opacity-50",
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} className={className}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
};
