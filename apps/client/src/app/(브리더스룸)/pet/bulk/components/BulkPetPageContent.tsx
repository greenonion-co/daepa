"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePetLimitDialog } from "@/app/(브리더스룸)/hooks/usePetLimitDialog";
import { toast } from "@/lib/toast";
import BulkPetToolbar from "./BulkPetToolbar";
import BulkPetGrid from "./BulkPetGrid";
import BulkPetSummary from "./BulkPetSummary";
import { useBulkPetForm } from "../hooks/useBulkPetForm";
import { useBulkPetUpload } from "../hooks/useBulkPetUpload";

const UPLOAD_PHASE_MESSAGES = [
  "데이터 검증 중...",
  "개체 정보 등록 중...",
  "이미지 업로드 처리 중...",
  "캐시 갱신 중...",
];

export default function BulkPetPageContent() {
  const router = useRouter();
  const form = useBulkPetForm();
  const { upload, isPending } = useBulkPetUpload();
  const { handlePetLimitError, petLimitDialog } = usePetLimitDialog();

  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successDialog, setSuccessDialog] = useState<{
    open: boolean;
    count: number;
  }>({ open: false, count: 0 });

  // 업로드 동안 페이지 이탈 방지 (탭 닫기/새로고침/외부 링크)
  useEffect(() => {
    if (!isPending) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isPending]);

  // 단계 안내 사이클 — 실제 진행률을 받지 못하므로 사용자가 멈췄다고 오인하지 않도록 메시지를 순환
  const [phaseIndex, setPhaseIndex] = useState(0);
  useEffect(() => {
    if (!isPending) {
      setPhaseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setPhaseIndex((prev) => (prev + 1) % UPLOAD_PHASE_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPending]);

  /** 업로드 버튼이 disabled일 때 사용자가 이유를 알 수 있도록 전달할 문구 */
  const uploadDisabledReason = useMemo<string | undefined>(() => {
    if (isPending) return undefined;
    if (form.rows.length === 0) return "등록할 행이 없습니다";
    if (!form.hasErrors) return undefined;

    const errorFields = new Set(form.clientErrors.map((e) => e.field));
    const messages: string[] = [];
    if (errorFields.has("name")) messages.push("개체 이름이 없는 행이 있습니다");
    if (errorFields.has("species")) messages.push("종이 선택되지 않은 행이 있습니다");
    if (errorFields.has("hatchingDate")) messages.push("해칭일 형식이 잘못된 행이 있습니다");
    if (errorFields.has("weight")) messages.push("몸무게가 올바르지 않은 행이 있습니다");
    if (errorFields.has("fatherName") || errorFields.has("motherName")) {
      messages.push("부/모개체 지정이 올바르지 않은 행이 있습니다");
    }
    if (messages.length === 0) {
      return `${form.errorCount}개의 검증 오류 — 빨간 셀을 수정해주세요`;
    }
    return messages.join("\n");
  }, [form.rows.length, form.hasErrors, form.clientErrors, form.errorCount, isPending]);

  const handleUpload = async () => {
    if (form.rows.length === 0) return;
    if (form.hasErrors) {
      toast.error("수정할 오류가 있습니다. 빨간 셀을 확인해주세요.");
      return;
    }

    const outcome = await upload(form.rows);

    if (outcome.status === "success") {
      setSuccessDialog({ open: true, count: outcome.successCount });
      form.clearAll();
      return;
    }

    if (outcome.status === "validation") {
      if (outcome.errors.length > 0) {
        form.setServerErrorsFromResponse(outcome.errors);
        toast.error(`서버 검증 실패: ${outcome.errors.length}개의 오류`);
        return;
      }
      // 전역 오류 (슬롯 초과 등) — code 기반으로 정확히 분기
      if (outcome.globalCode === "PET_PUBLIC_SLOT_EXCEEDED") {
        const axiosShape = {
          response: { data: { code: "PET_PUBLIC_SLOT_EXCEEDED" } },
        };
        if (handlePetLimitError(axiosShape as never)) return;
      }
      if (outcome.globalMessage) {
        setGlobalError(outcome.globalMessage);
      }
      return;
    }

    setGlobalError(outcome.message);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-white dark:bg-gray-900">
      <header className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h1 className="text-lg font-semibold">개체 대량 등록</h1>
        <p className="mt-1 text-xs text-gray-500">
          사업자 계정 전용 · 최대 100행 · 업로드 성공 시 초기화됩니다.
        </p>
      </header>

      <BulkPetToolbar
        rowCount={form.rows.length}
        hasErrors={form.hasErrors}
        isUploading={isPending}
        selectedCount={form.selectedIds.size}
        uploadDisabledReason={uploadDisabledReason}
        onAddRow={form.addRow}
        onDuplicateSelected={form.duplicateSelected}
        onDeleteSelected={form.deleteSelected}
        onClearAll={form.clearAll}
        onImport={form.mergeImportedRows}
        onUpload={handleUpload}
      />

      <div className="flex-1 overflow-auto p-3">
        <BulkPetGrid
          rows={form.rows}
          updateCell={form.updateCell}
          getCellError={form.getCellError}
          selectedIds={form.selectedIds}
          toggleSelection={form.toggleSelection}
          toggleSelectAll={form.toggleSelectAll}
        />
      </div>

      <BulkPetSummary rowCount={form.rows.length} errorCount={form.errorCount} />

      {/* 전역 오류 다이얼로그 */}
      <AlertDialog open={!!globalError} onOpenChange={(open) => !open && setGlobalError(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>업로드 실패</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-wrap">
              {globalError}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setGlobalError(null)}>확인</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 성공 후 선택 다이얼로그 — Cancel은 닫기만, navigation은 별도 Action 버튼 */}
      <AlertDialog
        open={successDialog.open}
        onOpenChange={(open) => !open && setSuccessDialog({ open: false, count: 0 })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>등록 완료</AlertDialogTitle>
            <AlertDialogDescription>
              {successDialog.count}개의 개체가 등록되었습니다. 이어서 등록하시겠어요?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setSuccessDialog({ open: false, count: 0 });
                router.push("/pet");
              }}
            >
              개체룸으로 이동
            </AlertDialogAction>
            <AlertDialogAction onClick={() => setSuccessDialog({ open: false, count: 0 })}>
              계속 등록
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 임시 저장본 복원 확인 */}
      <AlertDialog open={!!form.pendingDraft} onOpenChange={() => undefined}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>작성 중이던 내역이 있습니다</AlertDialogTitle>
            <AlertDialogDescription>
              {form.pendingDraft &&
                `${new Date(form.pendingDraft.savedAt).toLocaleString()}에 임시 저장된 ${form.pendingDraft.rows.length}행이 있습니다. 이어서 편집하시겠어요?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={form.dismissDraft}>처음부터 작성</AlertDialogCancel>
            <AlertDialogAction onClick={form.restoreDraft}>복원</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 업로드 중 풀스크린 오버레이 — 클릭/스크롤 차단 + 페이지 이탈 방지 안내 */}
      {isPending && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="업로드 진행 중"
        >
          <div className="mx-4 flex max-w-sm flex-col items-center gap-4 rounded-xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900">
            <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
            <div>
              <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {form.rows.length}개 개체를 등록하고 있습니다
              </p>
              <p className="mt-2 text-sm text-emerald-700 transition-opacity dark:text-emerald-400">
                {UPLOAD_PHASE_MESSAGES[phaseIndex]}
              </p>
            </div>
            <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              이미지 처리에 최대 1분이 걸릴 수 있습니다.
              <br />
              <strong className="text-red-600 dark:text-red-400">
                페이지를 닫거나 새로고침하지 마세요.
              </strong>
            </p>
          </div>
        </div>
      )}

      {petLimitDialog}
    </div>
  );
}
