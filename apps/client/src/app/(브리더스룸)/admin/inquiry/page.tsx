"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminInquiryControllerAnswer,
  adminInquiryControllerListAll,
  InquiryDtoStatus,
  UserProfileDtoRole,
} from "@repo/api-client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// orval 은 nullable 필드를 `{[key]: unknown} | null` 로 생성하므로 실제 shape 로 매핑해 사용한다.
type AdminInquiry = {
  id: number;
  content: string;
  status: InquiryDtoStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
};

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminInquiryCard = ({ inquiry }: { inquiry: AdminInquiry }) => {
  const queryClient = useQueryClient();
  const isAnswered = inquiry.status === InquiryDtoStatus.answered;
  const [answer, setAnswer] = useState("");

  const answerMutation = useMutation({
    mutationFn: async () =>
      (await adminInquiryControllerAnswer(inquiry.id, { answer })).data,
    onSuccess: () => {
      toast.success("답변이 등록되었습니다.");
      setAnswer("");
      queryClient.invalidateQueries({
        queryKey: [adminInquiryControllerListAll.name],
      });
    },
    onError: () => {
      toast.error("답변 등록에 실패했습니다.");
    },
  });

  const canSubmit = answer.trim().length > 0;

  return (
    <div className="rounded-xl border-2 border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-[#18171C]">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={isAnswered ? "default" : "secondary"}>
            {isAnswered ? "답변 완료" : "답변 대기"}
          </Badge>
          <span className="text-[13px] font-medium text-gray-900 dark:text-white">
            {inquiry.userName ?? inquiry.userId}
          </span>
          {inquiry.userEmail && (
            <span className="text-[12px] text-gray-400">
              {inquiry.userEmail}
            </span>
          )}
        </div>
        <span className="text-[12px] text-gray-400">
          {formatDate(inquiry.createdAt)}
        </span>
      </div>

      <p className="text-[15px] whitespace-pre-wrap text-gray-900 dark:text-white">
        {inquiry.content}
      </p>

      {isAnswered && inquiry.answer ? (
        <div className="mt-3 rounded-lg bg-gray-50 p-3 dark:bg-neutral-800">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400">
              답변
            </span>
            {inquiry.answeredAt && (
              <span className="text-[12px] text-gray-400">
                {formatDate(inquiry.answeredAt)}
              </span>
            )}
          </div>
          <p className="text-[14px] whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {inquiry.answer}
          </p>
        </div>
      ) : (
        <div className="mt-3">
          <Textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="답변을 입력하세요."
            rows={3}
            maxLength={2000}
          />
          <div className="mt-2 flex justify-end">
            <Button
              size="sm"
              disabled={!canSubmit || answerMutation.isPending}
              onClick={() => answerMutation.mutate()}
            >
              {answerMutation.isPending ? "등록 중..." : "답변 등록"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function AdminInquiryPage() {
  const { user } = useAuth();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: [adminInquiryControllerListAll.name],
    queryFn: async () =>
      (await adminInquiryControllerListAll())
        .data as unknown as AdminInquiry[],
    enabled: user?.role === UserProfileDtoRole.ADMIN,
  });

  if (!user || user.role !== UserProfileDtoRole.ADMIN) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        접근 권한이 없습니다.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 px-1 text-[20px] font-bold text-gray-900 dark:text-white">
        1:1 문의 관리
      </h1>

      {isLoading ? (
        <p className="px-1 py-8 text-center text-[14px] text-gray-400">
          불러오는 중...
        </p>
      ) : inquiries.length === 0 ? (
        <p className="px-1 py-8 text-center text-[14px] text-gray-400">
          접수된 문의가 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <AdminInquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}
    </div>
  );
}
