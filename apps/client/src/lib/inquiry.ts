import type { InquiryDtoStatus } from "@repo/api-client";

// orval 은 nullable 필드를 `{[key]: unknown} | null` 로 생성하므로 실제 shape 로 매핑해 사용한다.
export type Inquiry = {
  id: number;
  content: string;
  status: InquiryDtoStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
};

export type AdminInquiry = Inquiry & {
  userId: string;
  userName: string | null;
  userEmail: string | null;
};

export const formatInquiryDate = (value: string | Date) =>
  new Date(value).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
