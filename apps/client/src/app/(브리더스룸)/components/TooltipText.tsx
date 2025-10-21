"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const TooltipText = ({
  title,
  description,
  content,
  text = "",
  className,
}: {
  title?: string;
  description?: string;
  content?: string | React.ReactNode;
  text: string;
  className?: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("font-[500] text-gray-800", className)}>
          {text?.length > 10 ? `${text.slice(0, 10)}...` : text}
        </div>
      </TooltipTrigger>
      <TooltipContent className="min-w-[200px] max-w-[400px] rounded-2xl border border-gray-300 bg-white p-5 font-[500] shadow-lg">
        {title && <div className="text-[16px] font-[600] text-gray-800">{title}</div>}
        {description && <div className="pb-2 text-[12px] text-gray-500">{description}</div>}

        <div className="text-[14px] text-gray-800">{content ?? text}</div>
      </TooltipContent>
    </Tooltip>
  );
};

export default TooltipText;
