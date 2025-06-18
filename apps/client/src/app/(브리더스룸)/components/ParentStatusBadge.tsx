import { ParentDtoStatus } from "@repo/api-client";
import { STATUS_MAP } from "../constants";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const ParentStatusBadge = ({ status, isMyPet }: { status: string; isMyPet: boolean }) => {
  return (
    <Badge
      variant="outline"
      className={cn(
        STATUS_MAP[status as keyof typeof STATUS_MAP].color,
        "rounded-full font-semibold text-gray-100",
        isMyPet && "bg-blue-500",
      )}
    >
      {isMyPet ? (
        "나의 펫"
      ) : (
        <>
          {status === ParentDtoStatus.APPROVED && <BadgeCheck className="h-4 w-4 text-gray-100" />}
          {STATUS_MAP[status as keyof typeof STATUS_MAP].label}
        </>
      )}
    </Badge>
  );
};

export default ParentStatusBadge;
