"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  brPetControllerFindAll,
  petControllerBulkCreate,
  type BulkCreatePetRowDto,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import type { ServerFieldError } from "./useBulkPetForm";
import type { BulkPetRowValue } from "../lib/bulkPetSchema";
import { toDto } from "../lib/bulkPetSchema";

type ServerErrorBody = {
  code?: string;
  message?: string | string[];
  errors?: ServerFieldError[];
};

export type UploadOutcome =
  | { status: "success"; successCount: number; createdPetIds: string[] }
  | { status: "validation"; errors: ServerFieldError[]; globalMessage?: string }
  | { status: "error"; message: string };

export function useBulkPetUpload() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rows: BulkPetRowValue[]) => {
      const pets = rows.map(toDto);
      // images 필드는 orval 재생성 전이라 BulkCreatePetRowDto에 없을 수 있어 단언
      const res = await petControllerBulkCreate({ pets: pets as BulkCreatePetRowDto[] });
      return res.data;
    },
  });

  const upload = async (rows: BulkPetRowValue[]): Promise<UploadOutcome> => {
    try {
      const data = await mutation.mutateAsync(rows);
      await queryClient.invalidateQueries({
        queryKey: [brPetControllerFindAll.name],
      });
      const successCount =
        (data as unknown as { data?: { successCount?: number; createdPetIds?: string[] } })
          .data?.successCount ?? rows.length;
      const createdPetIds =
        (data as unknown as { data?: { successCount?: number; createdPetIds?: string[] } })
          .data?.createdPetIds ?? [];
      toast.success(`${successCount}개의 개체가 등록되었습니다.`);
      return { status: "success", successCount, createdPetIds };
    } catch (error) {
      if (error instanceof AxiosError) {
        const body = error.response?.data as ServerErrorBody | undefined;
        // 구조화된 검증 오류
        if (body?.code === "BULK_VALIDATION_FAILED" && Array.isArray(body.errors)) {
          toast.error(body.message as string ?? "검증 오류가 발생했습니다.");
          return { status: "validation", errors: body.errors };
        }
        // 공개 슬롯 초과 등 전역 오류
        if (body?.code) {
          const msg = Array.isArray(body.message) ? body.message.join("\n") : body.message;
          return {
            status: "validation",
            errors: [],
            globalMessage: msg ?? "등록 중 오류가 발생했습니다.",
          };
        }
        const msg = Array.isArray(body?.message) ? body?.message.join("\n") : body?.message;
        return { status: "error", message: msg ?? error.message };
      }
      return {
        status: "error",
        message: error instanceof Error ? error.message : "알 수 없는 오류",
      };
    }
  };

  return { upload, isPending: mutation.isPending };
}
