import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type BreederBadgeSize = "sm" | "md";

interface BreederBadgeProps {
  size?: BreederBadgeSize;
  className?: string;
}

const SIZE_STYLES: Record<BreederBadgeSize, { badge: string; icon: string }> = {
  sm: {
    badge: "gap-0.5 px-2 py-0.5 text-[10px]",
    icon: "h-2.5 w-2.5",
  },
  md: {
    badge: "gap-1 px-3 py-1 text-xs",
    icon: "h-3.5 w-3.5",
  },
};

const BreederBadge = ({ size = "md", className }: BreederBadgeProps) => {
  const styles = SIZE_STYLES[size];

  return (
    <span
      className={cn(
        "breeder-badge-shine inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-orange-500 font-bold text-white shadow-sm",
        styles.badge,
        className,
      )}
    >
      <Star className={cn("fill-current", styles.icon)} />
      Breeder
    </span>
  );
};

export default BreederBadge;
