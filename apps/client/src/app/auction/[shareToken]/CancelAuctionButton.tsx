"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/lib/toast";
import { cancelAuction } from "../api";
import type { AuctionStatus } from "../types";

const CONFIRM_PHRASE = "경매 취소";

interface CancelAuctionButtonProps {
  shareToken: string;
  status: AuctionStatus;
}

export default function CancelAuctionButton({ shareToken, status }: CancelAuctionButtonProps) {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isActive = status === "ACTIVE";
  const requiresPhrase = isActive;
  const canConfirm = !requiresPhrase || confirmText.trim() === CONFIRM_PHRASE;

  // 다이얼로그 닫힐 때 입력값 초기화
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) setConfirmText("");
  };

  const handleCancel = async () => {
    if (!canConfirm) return;
    setSubmitting(true);
    try {
      await cancelAuction(shareToken);
      toast.success("경매가 취소되었습니다.");
      handleOpenChange(false);
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      toast.error(e.response?.data?.message ?? e.message ?? "경매 취소에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
        >
          경매 취소
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isActive ? "진행 중인 경매를 취소하시겠습니까?" : "경매를 취소하시겠습니까?"}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              {isActive ? (
                <>
                  <p className="font-medium text-red-500">
                    이미 시작된 경매입니다.
                    <br />
                    취소하면 즉시 종료되며, 재개할 수 없습니다.
                  </p>
                  <p>
                    아래 입력란에{" "}
                    <strong className="text-foreground">&quot;{CONFIRM_PHRASE}&quot;</strong>를
                    정확히 입력하세요.
                  </p>
                </>
              ) : (
                <>
                  <p>이 경매를 취소합니다.</p>
                  <p className="text-muted-foreground">취소 후에는 되돌릴 수 없습니다.</p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        {requiresPhrase && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cancelConfirm" className="text-muted-foreground text-xs">
              취소 확인 문구
            </Label>
            <Input
              id="cancelConfirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_PHRASE}
              autoComplete="off"
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={submitting}>닫기</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleCancel();
            }}
            disabled={submitting || !canConfirm}
            className="bg-red-500 hover:bg-red-600"
          >
            {submitting ? "처리 중..." : "취소하기"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
