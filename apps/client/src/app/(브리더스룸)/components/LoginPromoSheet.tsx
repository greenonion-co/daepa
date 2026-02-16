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
import {
  isNativeApp,
  navigate,
  showNativeLoginPromoSheet,
  showNativeRelationPromoSheet,
} from "@/lib/native-bridge";
import { useRouter } from "next/navigation";
import { overlay } from "overlay-kit";

interface LoginPromoSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
}

const LoginPromoSheet = ({ isOpen, onOpenChange, title, description }: LoginPromoSheetProps) => {
  const router = useRouter();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-5 mb-5 max-w-[700px] rounded-3xl px-6 pt-6 pb-8 sm:mx-auto"
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
              if (isNativeApp()) {
                navigate({ screen: "Login" });
              } else {
                router.push("/sign-in");
              }
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

export const openLoginPromoSheet = () => {
  // 네이티브 앱에서는 네이티브 LoginPromoSheet 사용
  if (isNativeApp()) {
    showNativeLoginPromoSheet();
    return;
  }

  // 웹에서는 웹 버전 사용
  overlay.open(({ isOpen, close }) => (
    <LoginPromoSheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && close()}
      title="내 개체를 등록해보세요"
      description={
        <>
          <span className="text-gray-800">개체를 등록</span>하면
          <br />
          <span className="font-semibold text-blue-700">개체 관리・혈통 인증・분양 관리</span>가
          가능해요!
        </>
      }
    />
  ));
};

export const openRelationPromoSheet = () => {
  // 네이티브 앱에서는 네이티브 LoginPromoSheet (relation variant) 사용
  if (isNativeApp()) {
    showNativeRelationPromoSheet();
    return;
  }

  // 웹에서는 웹 버전 사용
  overlay.open(({ isOpen, close }) => (
    <LoginPromoSheet
      isOpen={isOpen}
      onOpenChange={(open) => !open && close()}
      title="혈통 정보를 한눈에"
      description={
        <>
          <span className="font-semibold text-blue-700">부모, 동배, 자손</span>까지
          <br />
          <span className="font-semibold text-gray-800">개체 관계도</span>로 혈통을 쉽게 확인할 수
          있어요
        </>
      }
    />
  ));
};

export default LoginPromoSheet;
