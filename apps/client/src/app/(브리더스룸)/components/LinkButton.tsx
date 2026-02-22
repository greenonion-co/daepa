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
    "inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 underline decoration-gray-900 underline-offset-2 transition-colors hover:bg-gray-200/70 dark:decoration-gray-100 dark:hover:bg-gray-700/70",
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
