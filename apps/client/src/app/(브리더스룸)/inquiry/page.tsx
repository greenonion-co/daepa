"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  inquiryControllerCreate,
  inquiryControllerListMine,
  InquiryDtoStatus,
} from "@repo/api-client";
import { toast } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// orval 은 nullable 필드를 `{[key]: unknown} | null` 로 생성하므로 실제 shape 로 매핑해 사용한다.
type Inquiry = {
  id: number;
  content: string;
  status: InquiryDtoStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};

const MAX_LENGTH = 2000;

const formatDate = (value: string | Date) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const InquiryCard = ({ inquiry }: { inquiry: Inquiry }) => {
  const isAnswered = inquiry.status === InquiryDtoStatus.answered;

  return (
    <div className="rounded-xl border-2 border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-[#18171C]">
      <div className="mb-2 flex items-center justify-between">
        <Badge variant={isAnswered ? "default" : "secondary"}>
          {isAnswered ? "답변 완료" : "답변 대기"}
        </Badge>
        <span className="text-[12px] text-gray-400">
          {formatDate(inquiry.createdAt)}
        </span>
      </div>
      <p className="text-[15px] whitespace-pre-wrap text-gray-900 dark:text-white">
        {inquiry.content}
      </p>

      {isAnswered && inquiry.answer && (
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
      )}
    </div>
  );
};

export default function InquiryPage() {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: [inquiryControllerListMine.name],
    queryFn: async () =>
      (await inquiryControllerListMine()).data as unknown as Inquiry[],
  });

  const createMutation = useMutation({
    mutationFn: async () => (await inquiryControllerCreate({ content })).data,
    onSuccess: () => {
      toast.success("문의가 접수되었습니다.");
      setContent("");
      queryClient.invalidateQueries({
        queryKey: [inquiryControllerListMine.name],
      });
    },
    onError: () => {
      toast.error("문의 접수에 실패했습니다.");
    },
  });

  const canSubmit = content.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-1 px-1 text-[20px] font-bold text-gray-900 dark:text-white">
        1:1 문의
      </h1>
      <p className="mb-4 px-1 text-[13px] text-gray-500 dark:text-gray-400">
        궁금한 점이나 불편한 점을 남겨주시면 확인 후 답변드립니다.
      </p>

      <div className="mb-6 rounded-xl border-2 border-neutral-100 bg-white p-4 dark:border-neutral-700 dark:bg-[#18171C]">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="문의 내용을 입력해주세요."
          rows={5}
          maxLength={MAX_LENGTH}
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={`text-[12px] ${
              content.length >= MAX_LENGTH
                ? "text-red-500"
                : "text-gray-400"
            }`}
          >
            {content.length >= MAX_LENGTH
              ? `최대 ${MAX_LENGTH.toLocaleString()}자까지 입력할 수 있어요.`
              : `최대 ${MAX_LENGTH.toLocaleString()}자`}
          </span>
          <span
            className={`text-[12px] ${
              content.length >= MAX_LENGTH ? "text-red-500" : "text-gray-400"
            }`}
          >
            {content.length.toLocaleString()}/{MAX_LENGTH.toLocaleString()}
          </span>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            disabled={!canSubmit || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? "접수 중..." : "문의 등록"}
          </Button>
        </div>
      </div>

      <h2 className="mb-2 px-1 text-[15px] font-semibold text-gray-900 dark:text-white">
        문의 내역
      </h2>

      {isLoading ? (
        <p className="px-1 py-8 text-center text-[14px] text-gray-400">
          불러오는 중...
        </p>
      ) : inquiries.length === 0 ? (
        <p className="px-1 py-8 text-center text-[14px] text-gray-400">
          문의 내역이 없습니다.
        </p>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inquiry) => (
            <InquiryCard key={inquiry.id} inquiry={inquiry} />
          ))}
        </div>
      )}
    </div>
  );
}
