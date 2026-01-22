"use client";
import { SIDEBAR_ITEMS } from "../constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Plus, Settings } from "lucide-react";
import { useSearchKeywordStore } from "../store/searchKeyword";
import UserButton from "./UserButton";
import { useIsMobile } from "@/hooks/useMobile";
import SearchInput from "./SearchInput";
import Image from "next/image";
import { useUserStore } from "../store/user";
import { isNativeApp } from "@/lib/native-bridge";
import LoginPromoSheet from "./LoginPromoSheet";
import { overlay } from "overlay-kit";

const Menubar = ({ unreadCount }: { unreadCount: number }) => {
  const { user } = useUserStore();
  const isLoggedIn = !!user?.userId;
  const isNative = isNativeApp();

  const pathname = usePathname();
  const isMobile = useIsMobile();
  const isPetDetail = pathname?.startsWith("/pet/") ?? false;

  const { setSearchKeyword } = useSearchKeywordStore();

  const openLoginPromoSheet = () => {
    overlay.open(({ isOpen, close }) => (
      <LoginPromoSheet
        isOpen={isOpen}
        onOpenChange={(open) => !open && close()}
        title="내 펫을 등록해보세요"
        description={
          <>
            <span className="font-semibold text-blue-700">펫 등록</span>하고
            <br />
            <span className="font-semibold text-gray-800">혈통 관리</span>를 시작하세요
          </>
        }
      />
    ));
  };

  return (
    <div
      className={cn(
        "dark:bg-background flex h-[52px] items-center justify-between px-2",
        isMobile && !isPetDetail && "bg-background sticky left-0 top-0 z-50 w-full",
        isNative && "pr-4",
      )}
    >
      {!isLoggedIn ? (
        isNative ? (
          !pathname.includes("/register/") && (
            <button
              onClick={openLoginPromoSheet}
              className={cn(
                "flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800",
              )}
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                <Plus className="h-3 w-3" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
                펫 추가하기
              </div>
            </button>
          )
        ) : (
          <Image src="/assets/logo.png" alt="브리더스룸 로고" width={60} height={60} />
        )
      ) : (
        <>
          <div className="flex items-center">
            {!isNative && !isMobile && (
              <Link href="/pet" className="mr-5 font-bold">
                <Image src="/assets/logo.png" alt="브리더스룸 로고" width={60} height={60} />
              </Link>
            )}

            {!isNative &&
              SIDEBAR_ITEMS.map((item) => (
                <Link
                  className={cn(
                    item.url === pathname
                      ? "font-bold text-black dark:text-white"
                      : "font-semibold text-gray-500 dark:text-gray-400",
                    isMobile ? "px-1.5" : "px-3 py-1.5",
                  )}
                  key={item.title}
                  href={item.url}
                >
                  {item.title}
                </Link>
              ))}
            {!pathname.includes("/register/") && (
              <Link href="/register/1">
                <div
                  className={cn(
                    "flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                    <Plus className="h-3 w-3" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
                    펫 추가하기
                  </div>
                </div>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isNative && pathname === "/pet" && (
              <div className="w-45">
                <SearchInput
                  placeholder="이름 또는 설명 검색.."
                  onKeyDown={(value) => setSearchKeyword(value)}
                />
              </div>
            )}

            {isMobile && (
              <>
                <Link href="/notifications" className="relative">
                  <Mail className="text-gray-500 dark:text-neutral-400" />
                  {unreadCount > 0 && (
                    <div className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[12px] font-medium text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </div>
                  )}
                </Link>
                {!isNative && (
                  <Link href="/settings">
                    <Settings className="text-gray-500 dark:text-neutral-400" />
                  </Link>
                )}
              </>
            )}
          </div>
          {!isNative && <UserButton />}
        </>
      )}
    </div>
  );
};

export default Menubar;
