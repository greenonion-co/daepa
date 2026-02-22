"use client";

import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface BadgeListProps {
  items?: string[];
  maxDisplay?: number;
  variant?: "default" | "secondary" | "outline" | "destructive";
  badgeSize?: "sm" | "md";
  badgeClassName?: string;
  /** true이면 감싸는 div 없이 Fragment로 렌더링 (부모에서 flex-wrap 제어) */
  inline?: boolean;
}

const BadgeList = ({
  items,
  maxDisplay = 5,
  variant = "default",
  badgeSize = "md",
  badgeClassName,
  inline = false,
}: BadgeListProps) => {
  if (!items || items.length === 0) return null;

  const displayItems = items.slice(0, maxDisplay);
  const remainingItems = items.slice(maxDisplay);
  const remaining = remainingItems.length;

  const content = (
    <>
      {displayItems.map((item, index) => (
        <Badge
          key={`${item}-${index}`}
          variant={variant}
          size={badgeSize}
          className={cn(badgeClassName)}
        >
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" size={badgeSize} className="cursor-pointer">
              +{remaining}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="flex flex-col gap-1">
              {remainingItems.map((item, index) => (
                <span key={`remaining-${item}-${index}`}>{item}</span>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      )}
    </>
  );

  if (inline) return content;

  return <div className="flex flex-wrap gap-1">{content}</div>;
};

export default BadgeList;
