import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

const LinkButton = ({ href, label, tooltip }: { href: string; label: string; tooltip: string }) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          href={href}
          className="inline-flex items-center gap-1 rounded-md bg-sky-100 py-0.5 pl-2 pr-1 text-sky-600 hover:bg-sky-200 dark:bg-sky-900/50 dark:text-sky-400 dark:hover:bg-sky-900"
        >
          {label}
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};

export default LinkButton;
