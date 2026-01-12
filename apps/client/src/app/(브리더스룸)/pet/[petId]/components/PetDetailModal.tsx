"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface PetDetailModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function PetDetailModal({ children, onClose }: PetDetailModalProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pb-0 pt-[16px] sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl dark:bg-neutral-800">
        {children}
      </DialogContent>
    </Dialog>
  );
}

// 서버 컴포넌트에서 사용 가능한 편의 컴포넌트
export function PetDetailModalBack({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <PetDetailModal onClose={() => router.back()}>{children}</PetDetailModal>;
}

export function PetDetailModalPush({
  children,
  href = "/pet",
}: {
  children: ReactNode;
  href?: string;
}) {
  const router = useRouter();
  return <PetDetailModal onClose={() => router.push(href)}>{children}</PetDetailModal>;
}
