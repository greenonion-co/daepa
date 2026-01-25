import { Plus } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { useIsMobile } from "@/hooks/useMobile";
import { openLoginPromoSheet } from "@/app/(브리더스룸)/components/LoginPromoSheet";

const FloatingButton = () => {
  return (
    <div className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600 shadow-md shadow-blue-200/50 ring-1 ring-blue-200/50 transition-all active:scale-95 dark:bg-blue-900/50 dark:text-blue-400 dark:shadow-blue-900/30 dark:ring-blue-800/50">
      <Plus className="h-7 w-7" strokeWidth={2.5} />
    </div>
  );
};

const TextButton = () => (
  <div className="flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
      <Plus className="h-3 w-3" />
    </div>
    <span className="px-2 py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
      펫 추가하기
    </span>
  </div>
);

const AddPetButton = () => {
  const isLoggedIn = useUserStore((state) => !!state.user?.userId);
  const isMobile = useIsMobile();

  // 웹, 모바일웹
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
