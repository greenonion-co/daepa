import { cn } from "@/lib/utils";

interface SettingsGroupProps {
  title?: string;
  subTitle?: string;
  className?: string;
  children: React.ReactNode;
}

export const SettingsGroup = ({ title, subTitle, className, children }: SettingsGroupProps) => (
  <div className={cn("mb-4 px-2", className)}>
    {title && (
      <div className="mb-2 flex items-baseline gap-2 px-4">
        <h2 className="text-[13px] font-medium text-gray-500 uppercase dark:text-gray-400">
          {title}
        </h2>
        {subTitle && (
          <span className="text-[11px] font-medium text-blue-500 dark:text-blue-400">{subTitle}</span>
        )}
      </div>
    )}
    <div className="h-fit overflow-hidden rounded-xl border-2 border-neutral-100 bg-white dark:bg-[#18171C]">
      {children}
    </div>
  </div>
);
