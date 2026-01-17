import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  parentRequestControllerUpdateStatus,
  userNotificationControllerDelete,
  userNotificationControllerFindAll,
  UpdateParentRequestDto,
  UpdateParentRequestDtoStatus,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import { AxiosError } from "axios";

export const useNotificationActions = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateParentStatus } = useMutation({
    mutationFn: ({ id, status, rejectReason }: UpdateParentRequestDto & { id: number }) =>
      parentRequestControllerUpdateStatus(id, { status, rejectReason }),
  });

  const { mutateAsync: deleteNotification } = useMutation({
    mutationFn: ({ id, receiverId }: { id: number; receiverId: string }) =>
      userNotificationControllerDelete({ id, receiverId }),
  });

  const handleUpdate = async (
    id: number,
    status: UpdateParentRequestDtoStatus,
    rejectReason?: string,
    close?: () => void,
  ) => {
    try {
      const res = await updateParentStatus({
        id,
        status,
        rejectReason,
      });

      toast.success(
        res?.data?.message ??
          `부모 연동이 ${status === UpdateParentRequestDtoStatus.APPROVED ? "수락" : status === UpdateParentRequestDtoStatus.CANCELLED ? "취소" : "거절"} 되었습니다.`,
      );

      await queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
      close?.();
    } catch (error: unknown) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message ?? "부모 연동 상태 변경에 실패했습니다.");
      } else {
        toast.error("부모 연동 상태 변경에 실패했습니다.");
      }
    }
  };

  const handleDeleteNotification = async (id: number, receiverId: string, close?: () => void) => {
    try {
      const res = await deleteNotification({ id, receiverId });
      if (res?.data?.success) {
        await queryClient.invalidateQueries({ queryKey: [userNotificationControllerFindAll.name] });
        toast.success("알림이 삭제되었습니다.");
        close?.();
      } else {
        toast.error("알림 삭제에 실패했습니다.");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error?.response?.data?.message ?? error);
      }
      toast.error(`알림 삭제에 실패했습니다. ${error}`);
    }
  };

  return {
    handleUpdate,
    handleDeleteNotification,
  };
};
