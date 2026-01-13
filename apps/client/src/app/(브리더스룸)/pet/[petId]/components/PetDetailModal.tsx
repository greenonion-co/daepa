"use client";

import { ReactNode, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ModalProvider } from "./ModalContext";

interface PetDetailModalProps {
  children: ReactNode;
  onClose: () => void;
}

export default function PetDetailModal({ children, onClose }: PetDetailModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // 다른 페이지로 이동 시 모달 닫고 이동
  // 히스토리: /pet → /pet/{id}(모달) → /pet/{id}/relation
  // 뒤로가기 시: /pet/{id}/relation → /pet (모달 건너뛰고 목록으로)
  const navigateAway = useCallback((url: string) => {
    setPendingNavigation(url);
    setIsOpen(false);
  }, []);

  // 모달 닫힘 애니메이션 후 페이지 이동
  useEffect(() => {
    if (!isOpen && pendingNavigation) {
      const timer = setTimeout(() => {
        // 모달 히스토리를 건너뛰고 새 페이지로 이동
        // 결과 히스토리: /pet → /pet/{id}/relation
        router.back(); // /pet로 돌아감
        setTimeout(() => {
          router.push(pendingNavigation);
        }, 50);
      }, 200); // Dialog 애니메이션 시간
      return () => clearTimeout(timer);
    }
  }, [isOpen, pendingNavigation, router]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-full flex-col gap-0 overflow-hidden rounded-none bg-gray-100 px-0 pt-[16px] pb-0 sm:max-w-full md:h-auto md:max-h-[90vh] md:w-[calc(100%-2rem)] md:max-w-[900px] md:rounded-2xl dark:bg-neutral-800">
        <DialogTitle className="sr-only">펫 상세 정보</DialogTitle>
        <ModalProvider navigateAway={navigateAway}>{children}</ModalProvider>
      </DialogContent>
    </Dialog>
  );
}

// 서버 컴포넌트에서 사용 가능한 편의 컴포넌트
export function PetDetailModalBack({ children }: { children: ReactNode }) {
  const router = useRouter();
  return <PetDetailModal onClose={() => router.back()}>{children}</PetDetailModal>;
}
