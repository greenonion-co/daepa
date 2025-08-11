import { UpdateParentRequestDtoStatus, UserNotificationDto } from "@repo/api-client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { UserNotificationDtoType } from "@repo/api-client";

const StatusBadge = ({ item }: { item: UserNotificationDto }) => {
  const status = item.detailJson?.status;

  if (
    !(
      item.type === UserNotificationDtoType.PARENT_REQUEST &&
      !!status &&
      (status === UpdateParentRequestDtoStatus.APPROVED ||
        status === UpdateParentRequestDtoStatus.REJECTED ||
        status === UpdateParentRequestDtoStatus.CANCELLED)
    )
  )
    return;

  return (
    <Badge
      className={cn(
        "my-1 px-2 text-sm font-semibold",
        status === UpdateParentRequestDtoStatus.APPROVED
          ? "bg-green-500 text-white"
          : status === UpdateParentRequestDtoStatus.REJECTED
            ? "bg-red-500 text-white"
            : "bg-gray-500 text-white",
      )}
    >
      {status === UpdateParentRequestDtoStatus.APPROVED && "수락"}
      {status === UpdateParentRequestDtoStatus.REJECTED && "거절"}
      {status === UpdateParentRequestDtoStatus.CANCELLED && "취소"}
    </Badge>
  );
};

export default StatusBadge;
