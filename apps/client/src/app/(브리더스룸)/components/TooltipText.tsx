"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TooltipText = ({
  title,
  description,
  content,
  text = "",
  className,
  displayTextLength = 10,
}: {
  title?: string;
  description?: string;
  content?: string | React.ReactNode;
  text: string;
  className?: string;
  displayTextLength?: number;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn("font-[500] text-gray-800 dark:text-gray-200", className)}>
          {text?.length > displayTextLength ? `${text.slice(0, displayTextLength)}...` : text}
        </span>
      </TooltipTrigger>
      <TooltipContent className="min-w-[200px] max-w-[300px] rounded-2xl border border-gray-300 bg-white p-5 font-[500] shadow-lg dark:border-gray-600 dark:bg-gray-700">
        {title && (
          <div className="text-[16px] font-[600] text-gray-800 dark:text-gray-100">{title}</div>
        )}
        {description && (
          <div className="pb-2 text-[12px] text-gray-500 dark:text-gray-400">{description}</div>
        )}

        <div className="whitespace-pre-wrap break-keep text-[14px] text-gray-800 dark:text-gray-200">
          {content ?? text}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipText;
