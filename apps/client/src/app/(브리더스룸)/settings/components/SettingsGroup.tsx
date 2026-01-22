import { cn } from "@/lib/utils";

interface SettingsGroupProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup = ({ title, className, children }: SettingsGroupProps) => (
  <div className={cn("mb-4", className)}>
    {title && (
      <h2 className="mb-2 px-4 text-[13px] font-medium uppercase text-gray-500 dark:text-gray-400">
        {title}
      </h2>
    )}
    <div className="overflow-hidden rounded-xl dark:bg-neutral-800">{children}</div>
  </div>
);
