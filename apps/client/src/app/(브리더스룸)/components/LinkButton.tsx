import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
  tooltip?: string;
  className?: string;
  icon?: React.ReactNode;
}) => {
  const linkClass = cn(
    "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-semibold text-[#1264A3] no-underline transition-colors hover:underline hover:decoration-[#1264A3] dark:text-[#1D9BD1] dark:hover:decoration-[#1D9BD1]",
    className,
  );

  if (!tooltip) {
    return (
      <Link href={href} className={linkClass}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} className={linkClass}>
          {icon}
          {label}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default LinkButton;
