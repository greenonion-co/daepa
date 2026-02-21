import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SquareArrowOutUpRight } from "lucide-react";

const LinkButton = ({
  href,
  label,
  tooltip,
  className,
  icon,
}: {
  href: string;
  label: string;
  tooltip?: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  if (!tooltip) {
    return (
      <Link
        href={href}
        className={cn("inline-flex items-center gap-0.5 rounded-md py-0.5", className)}
      >
        {icon}
        {label}
        <SquareArrowOutUpRight className={"ml-0.5 h-2.5 w-2.5"} />
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          className={cn("inline-flex items-center gap-0.5 rounded-md py-0.5", className)}
        >
          {icon}
          {label}
          <SquareArrowOutUpRight className={"ml-0.5 h-2.5 w-2.5"} />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default LinkButton;
