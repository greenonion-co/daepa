"use client";

import { ReactNode } from "react";

interface InfoRowProps {
  label: string;
  children: ReactNode;
  /** 라벨 너비 클래스 @default "w-12" */
  labelWidth?: string;
}

/**
 * 라벨-값 형태의 정보를 표시하는 공통 컴포넌트
 *
 * @example
 * <InfoRow label="무게">{pet.weight}g</InfoRow>
 * <InfoRow label="분양가" labelWidth="w-16">{price.toLocaleString()}원</InfoRow>
 */
export default function InfoRow({ label, children, labelWidth = "w-12" }: InfoRowProps) {
  return (
    <div className="flex">
      <span className={`${labelWidth} shrink-0 text-gray-500 dark:text-gray-400`}>{label}</span>
      <span className="text-gray-900 dark:text-gray-100">{children}</span>
    </div>
  );
}
