"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import {
  AXIOS_INSTANCE,
  brPetControllerFindAll,
  type BulkCreatePetRowDto,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import type { ServerFieldError } from "./useBulkPetForm";
import type { BulkPetRowValue } from "../lib/bulkPetSchema";
import { toDto } from "../lib/bulkPetSchema";

/**
 * 100행 + 이미지 처리는 서버에서 최대 ~30s 소요 가능.
 * 무한 대기를 막고 사용자에게 명확한 실패 신호를 주기 위해 90s로 명시.
 */
const BULK_UPLOAD_TIMEOUT_MS = 90_000;

type ServerErrorBody = {
  code?: string;
  message?: string | string[];
  errors?: ServerFieldError[];
};

export type UploadOutcome =
  | { status: "success"; successCount: number; createdPetIds: string[] }
  | {
      status: "validation";
      errors: ServerFieldError[];
      globalCode?: string;
      globalMessage?: string;
    }
  | { status: "error"; message: string };

export function useBulkPetUpload() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (rows: BulkPetRowValue[]) => {
      const pets = rows.map(toDto);
      // 명시적 timeout이 필요해 orval 함수 대신 AXIOS_INSTANCE 직접 호출
      // (BulkPetUpload는 응답이 길어질 수 있어 axios 기본 무한 timeout이 위험)
      const res = await AXIOS_INSTANCE<{
        success: boolean;
        message: string;
        data: { successCount: number; createdPetIds: string[] };
      }>({
        url: "/api/v1/pet/bulk",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        data: { pets: pets as BulkCreatePetRowDto[] },
        timeout: BULK_UPLOAD_TIMEOUT_MS,
      });
      return res.data;
    },
  });

  const upload = async (rows: BulkPetRowValue[]): Promise<UploadOutcome> => {
    try {
      const data = await mutation.mutateAsync(rows);
      await queryClient.invalidateQueries({
        queryKey: [brPetControllerFindAll.name],
      });
      const successCount = data.data?.successCount ?? rows.length;
      const createdPetIds = data.data?.createdPetIds ?? [];
      toast.success(`${successCount}개의 개체가 등록되었습니다.`);
      return { status: "success", successCount, createdPetIds };
    } catch (error) {
      if (error instanceof AxiosError) {
        // 명시적 timeout 초과 케이스 — 사용자에게 분명히 알림
        if (error.code === "ECONNABORTED") {
          return {
            status: "error",
            message:
              "응답 대기 시간이 초과되었습니다. 일부 개체는 이미 등록되었을 수 있으니 새로고침 후 확인해주세요.",
          };
        }
        const body = error.response?.data as ServerErrorBody | undefined;
        // 구조화된 검증 오류
        if (body?.code === "BULK_VALIDATION_FAILED" && Array.isArray(body.errors)) {
          toast.error((body.message as string) ?? "검증 오류가 발생했습니다.");
          return { status: "validation", errors: body.errors };
        }
        // 공개 슬롯 초과 등 전역 오류 — code를 그대로 노출해 호출부에서 키워드 매칭 회피
        if (body?.code) {
          const msg = Array.isArray(body.message) ? body.message.join("\n") : body.message;
          return {
            status: "validation",
            errors: [],
            globalCode: body.code,
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
