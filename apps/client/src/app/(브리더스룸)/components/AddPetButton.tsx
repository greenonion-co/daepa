import { Plus } from "lucide-react";
import Link from "next/link";
import { useIsLoggedIn } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useMobile";
import { isNativeApp, navigate } from "@/lib/native-bridge";
import { openLoginPromoSheet } from "@/app/(브리더스룸)/components/LoginPromoSheet";

const FloatingButton = () => {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-md ring-1 shadow-blue-200/50 ring-blue-200/50 transition-all active:scale-95 dark:bg-blue-900/50 dark:text-blue-400 dark:shadow-blue-900/30 dark:ring-blue-800/50">
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </div>
  );
};

const TextButton = () => (
  <div className="flex w-fit items-center gap-1 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
      <Plus className="h-3 w-3" />
    </div>
    <span className="py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
      개체 추가하기
    </span>
  </div>
);

const AddPetButton = () => {
  const isLoggedIn = useIsLoggedIn();
  const isMobile = useIsMobile();

  const handleClick = () => {
    if (!isLoggedIn) {
      openLoginPromoSheet();
      return;
    }
    if (isNativeApp()) {
      navigate({ path: "/register/1", options: { replace: false } });
    }
  };

  // 네이티브: button으로 처리 (Link의 preventDefault 불안정)
  if (isNativeApp()) {
    return (
      <button type="button" onClick={handleClick}>
        <FloatingButton />
      </button>
    );
  }

  // 웹: 기존 Link 유지
  return (
    <Link
      href="/register/1"
      onClick={(e) => {
        if (!isLoggedIn) {
          e.preventDefault();
          openLoginPromoSheet();
        }
      }}
    >
      {isMobile ? <FloatingButton /> : <TextButton />}
    </Link>
  );
};

export default AddPetButton;
