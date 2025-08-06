import { UpdateParentRequestDtoStatus, UserNotificationDto } from "@repo/api-client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserNotificationDtoType } from "@repo/api-client";

const StatusBadge = ({ item }: { item: UserNotificationDto }) => {
  if (
    !(
      item.type === UserNotificationDtoType.PARENT_REQUEST &&
      !!item.detailJson?.status &&
      item.detailJson?.status !== UpdateParentRequestDtoStatus.PENDING
    )
  )
    return;

  return (
    <Badge
      className={cn(
        "my-1 px-2 text-sm font-semibold",
        item.detailJson?.status === UpdateParentRequestDtoStatus.APPROVED
          ? "bg-green-500 text-white"
          : item.detailJson?.status === UpdateParentRequestDtoStatus.REJECTED
            ? "bg-red-500 text-white"
            : "bg-gray-500 text-white",
      )}
    >
      {item.detailJson?.status === UpdateParentRequestDtoStatus.APPROVED && "수락"}
      {item.detailJson?.status === UpdateParentRequestDtoStatus.REJECTED && "거절"}
      {item.detailJson?.status === UpdateParentRequestDtoStatus.CANCELLED && "취소"}
    </Badge>
  );
};

export default StatusBadge;
