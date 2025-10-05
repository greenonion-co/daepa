import {
  UpdateUserNotificationDto,
  userNotificationControllerFindAll,
  userNotificationControllerUpdate,
  UserNotificationDto,
  UserNotificationDtoStatus,
} from "@repo/api-client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useCallback } from "react";
import { toast } from "sonner";

export const useNotificationRead = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateNotification } = useMutation({
    mutationFn: (data: UpdateUserNotificationDto) => userNotificationControllerUpdate(data),
  });

  const setNotificationRead = useCallback(
    async (item: UserNotificationDto) => {
      if (item.status === UserNotificationDtoStatus.UNREAD) {
        try {
          await updateNotification({ id: item.id, status: UserNotificationDtoStatus.READ });
          queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
        } catch (error) {
          if (error instanceof AxiosError) {
            toast.error(error.response?.data?.message ?? "알림 읽음 처리에 실패했습니다.");
          } else {
            toast.error("알림 읽음 처리에 실패했습니다.");
          }
        }
      }
    },
    [updateNotification, queryClient],
  );

  return { setNotificationRead };
};
