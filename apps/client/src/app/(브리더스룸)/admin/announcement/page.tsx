"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  adminAnnouncementControllerCreateAnnouncement,
  UserProfileDtoRole,
} from "@repo/api-client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export default function AdminAnnouncementPage() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [path, setPath] = useState("");

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await adminAnnouncementControllerCreateAnnouncement({
        title,
        body,
        path: path || undefined,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("공지 발송이 시작되었습니다.");
      setTitle("");
      setBody("");
      setPath("");
    },
    onError: () => {
      toast.error("공지 발송에 실패했습니다.");
    },
  });

  // 관리자만 접근 가능
  if (!user || user.role !== UserProfileDtoRole.ADMIN) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        접근 권한이 없습니다.
      </div>
    );
  }

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>공지 푸시 발송</CardTitle>
          <CardDescription>
            활성 알림 토큰을 가진 전체 사용자에게 푸시 알림을 발송합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="공지 제목"
              maxLength={255}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">내용</Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="공지 내용"
              rows={5}
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="path">이동 경로 (선택)</Label>
            <Input
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="예: /notice/1"
            />
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                className="w-full"
                disabled={!canSubmit || sendMutation.isPending}
              >
                {sendMutation.isPending ? "발송 중..." : "전체 발송"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>전체 사용자에게 발송할까요?</AlertDialogTitle>
                <AlertDialogDescription>
                  활성 알림 토큰을 가진 모든 사용자에게 푸시가 발송됩니다. 이
                  작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => sendMutation.mutate()}>
                  발송
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
