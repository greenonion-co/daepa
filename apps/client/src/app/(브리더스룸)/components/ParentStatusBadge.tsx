import { UpdateParentRequestDtoStatus } from "@repo/api-client";
import { STATUS_MAP } from "../constants";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ParentStatusBadge = ({ status }: { status: string }) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        STATUS_MAP[status as keyof typeof STATUS_MAP].color,
        "rounded-full font-semibold text-gray-100",
      )}
    >
      {status === UpdateParentRequestDtoStatus.APPROVED && (
        <BadgeCheck className="h-4 w-4 text-gray-100" />
      )}
      {STATUS_MAP[status as keyof typeof STATUS_MAP].label}
    </Badge>
  );
};

export default ParentStatusBadge;
