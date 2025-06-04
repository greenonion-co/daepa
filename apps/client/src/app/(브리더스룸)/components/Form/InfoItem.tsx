import { TooltipContent } from "@/components/ui/tooltip";
import { Tooltip, TooltipTrigger } from "@/components/ui/tooltip";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { InfoIcon } from "lucide-react";

const InfoItem = ({
  label,
  value,
  className,
  shouldHighlight,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  shouldHighlight?: boolean;
}) => (
  <div className={cn("flex items-center py-1", className)}>
    <dt className="flex max-h-[36px] min-w-[80px] shrink-0 items-center text-[16px] text-gray-500">
      {shouldHighlight && (
        <TooltipProvider>
          <Tooltip open>
            <TooltipTrigger>
              <InfoIcon className="mr-1 h-4 w-4 text-red-500" />
            </TooltipTrigger>
            <TooltipContent side="top">필수 정보입니다. </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {label}
    </dt>
    <dd className="flex-1">{value}</dd>
  </div>
);

export default InfoItem;
