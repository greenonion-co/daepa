import { cn } from "@/lib/utils";

interface SettingsGroupProps {
  title?: string;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup = ({ title, className, children }: SettingsGroupProps) => (
  <div className={cn("mb-4 px-2", className)}>
    {title && (
      <h2 className="mb-2 px-4 text-[13px] font-medium text-gray-500 uppercase dark:text-gray-400">
        {title}
      </h2>
    )}
    <div className="h-fit overflow-hidden rounded-xl border-2 border-neutral-100 bg-white dark:bg-[#18171C]">
      {children}
    </div>
  </div>
);
