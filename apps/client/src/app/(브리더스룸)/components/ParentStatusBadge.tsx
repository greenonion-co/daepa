"use client";

import { cn } from "@/lib/utils";
import ParentStatusIcon from "./ParentStatusIcon";
import { overlay } from "overlay-kit";
import LineageCertificateCard from "./LineageCertificateCard";

const statusStyle: Record<string, { className: string; label: string }> = {
  approved: {
    className: "bg-green-100 text-[#0F7B6C] dark:bg-green-900/30 dark:text-[#4DAB9A]",
    label: "인증서 보유",
  },
  pending: {
    className: "bg-orange-100 text-[#D9730D] dark:bg-orange-900/30 dark:text-[#FFA344]",
    label: "요청",
  },
  rejected: {
    className: "bg-red-100 text-[#E03E3E] dark:bg-red-900/30 dark:text-[#FF7369]",
    label: "거절",
  },
};

interface ParentStatusBadgeProps {
  status: string;
  ownerName?: string;
  parentName?: string;
}

const ParentStatusBadge = ({ status, ownerName, parentName }: ParentStatusBadgeProps) => {
  const style = statusStyle[status];
  if (!style) return null;

  const isApproved = status === "approved" && ownerName && parentName;

  const handleClick = (e: React.MouseEvent) => {
    if (!isApproved) return;
    e.preventDefault();
    e.stopPropagation();
    overlay.open(({ isOpen, close }) => (
      <LineageCertificateCard
        isOpen={isOpen}
        onClose={close}
        ownerName={ownerName}
        parentName={parentName}
      />
    ));
  };

  return (
    <span
      onClick={handleClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        style.className,
        isApproved && "cursor-pointer transition-opacity hover:opacity-80",
      )}
    >
      <ParentStatusIcon status={status} />
      {style.label}
    </span>
  );
};

export default ParentStatusBadge;
