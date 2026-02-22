import { CircleCheck, Hourglass, X, Ban, Minus } from "lucide-react";
import type { ElementType } from "react";

const iconMap: Record<string, { Icon: ElementType; className: string }> = {
  approved: { Icon: CircleCheck, className: "text-green-500" },
  pending: { Icon: Hourglass, className: "text-amber-400" },
  rejected: { Icon: X, className: "text-red-400" },
  deleted: { Icon: Ban, className: "text-red-400" },
  cancelled: { Icon: Minus, className: "text-gray-400" },
};

export default function ParentStatusIcon({ status }: { status: string }) {
  const config = iconMap[status];
  if (!config) return null;
  const { Icon, className } = config;
  return <Icon className={`h-3 w-3 ${className}`} />;
}
