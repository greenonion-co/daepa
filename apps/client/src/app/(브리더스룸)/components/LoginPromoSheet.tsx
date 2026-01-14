"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import Image from "next/image";

interface LoginPromoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
}

const LoginPromoSheet = ({ isOpen, onOpenChange, title, description }: LoginPromoSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-5 mb-5 max-w-[700px] rounded-3xl px-6 pb-8 pt-6 sm:mx-auto"
      >
        <SheetHeader className="flex items-center">
          <Image
            alt="펫 관계도 바텀시트 이미지"
            src="/assets/lizard_face.png"
            width={100}
            height={100}
          />

          <SheetTitle className="text-center text-lg">{title}</SheetTitle>
          <SheetDescription className="text-center text-sm leading-relaxed text-neutral-600">
            {description}
          </SheetDescription>
        </SheetHeader>

        <SheetFooter className="flex-col gap-2 p-0">
          <Button
            className="w-full rounded-xl bg-neutral-800 py-6 text-base font-semibold hover:bg-black"
            onClick={() => {
              onOpenChange(false);
              window.location.href = "/sign-in";
            }}
          >
            시작하기
          </Button>
          <button
            className="pt-2 text-sm text-neutral-500 hover:text-neutral-700"
            onClick={() => onOpenChange(false)}
          >
            다음에 할게요
          </button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default LoginPromoSheet;
