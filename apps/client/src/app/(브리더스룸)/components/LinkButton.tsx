import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const LinkButton = ({
  href,
  label,
  tooltip,
  className,
  icon,
}: {
  href: string;
  label: string;
  tooltip: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          href={href}
          className={cn(
            "inline-flex items-center gap-1 rounded-md bg-sky-100 py-0.5 pl-2 pr-1 text-sky-600",
            className,
          )}
        >
          {icon}
          {label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default LinkButton;
