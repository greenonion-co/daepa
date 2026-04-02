"use client";
import { SIDEBAR_ITEMS } from "../constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useCallback } from "react";
import { Bell, Settings } from "lucide-react";
import { useSearchKeywordStore } from "../store/searchKeyword";
import { useIsMobile } from "@/hooks/useMobile";
import SearchInput from "./SearchInput";
import { useIsLoggedIn, useUser } from "@/hooks/useAuth";
import { isNativeApp } from "@/lib/native-bridge";
import AddPetButton from "@/app/(브리더스룸)/components/AddPetButton";
import AddPetBulkButton from "@/app/(브리더스룸)/components/AddPetBulkButton";

const BETA_TAP_COUNT = 5;
const BETA_TAP_TIMEOUT = 3000;

const Menubar = ({ unreadCount }: { unreadCount: number }) => {
  const isLoggedIn = useIsLoggedIn();
  const user = useUser();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { searchKeyword, setSearchKeyword } = useSearchKeywordStore();

  // 로고 10번 탭 → 로그인 백도어
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const handleLogoTap = useCallback(() => {
    if (isLoggedIn) return;
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, BETA_TAP_TIMEOUT);
    if (tapCountRef.current >= BETA_TAP_COUNT) {
      tapCountRef.current = 0;
      window.location.href = "/sign-in";
    }
  }, [isLoggedIn]);

  // 페이지 이동 시 검색어 초기화
  useEffect(() => {
    setSearchKeyword("");
  }, [pathname, setSearchKeyword]);

  // 상태 플래그
  const isNative = isNativeApp();
  const isRegisterPage = pathname.includes("/register/");
  const isPetDetailPage = pathname?.startsWith("/pet/") ?? false;
  const isShowcase = pathname?.startsWith("/@") ?? false;
  const isFeedPage = pathname === "/";
  const isPetListPage = pathname === "/pet";

  // 알림 아이콘 컴포넌트
  const NotificationIcon = () => (
    <Link href="/notifications" className="relative" aria-label="알림">
      <Bell className="text-gray-500 dark:text-neutral-400" />
      {unreadCount > 0 && (
        <div className="absolute -top-2 -right-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[12px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
    </Link>
  );

  // 로고 컴포넌트
  const Logo = ({ withLink = false, isMobile }: { withLink?: boolean; isMobile?: boolean }) => {
    const logo = (
      <h1
        className={cn("pr-4 text-2xl font-bold", isMobile && "px-1 text-lg")}
        onClick={handleLogoTap}
      >
        BREEDY
      </h1>
    );

    if (isNative && withLink) {
      return (
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}>
          {logo}
        </button>
      );
    }

    if (withLink) {
      return <Link href="/">{logo}</Link>;
    }

    return logo;
  };

  // 네비게이션 링크 컴포넌트
  const NavLinks = () => (
    <>
      {SIDEBAR_ITEMS.map((item) => {
        const href =
          item.url === "/@" && user?.name ? `/@${encodeURIComponent(user.name)}` : item.url;
        return (
          <Link
            key={item.title}
            href={href}
            className={cn(
              (item.url === "/@" ? isShowcase : item.url === pathname)
                ? "font-semibold text-blue-500 underline"
                : "font-semibold text-gray-500 hover:text-blue-500 hover:underline dark:text-gray-400",
              isMobile ? "my-auto px-1.5" : "px-3 py-1.5",
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </>
  );

  // 게스트/피드 뷰 렌더링
  const renderGuestView = () => (
    <>
      <Logo withLink isMobile={isMobile} />
      {/* 웹에서만 메뉴바에 렌더링 */}
      {!isNative && !isMobile && !isRegisterPage && <AddPetButton />}
      {!isNative && isMobile && !pathname?.startsWith("/sign-in") && (
        <Link
          href="/beta-closed"
          className="rounded-full px-3 py-1 text-xs font-medium text-blue-500"
        >
          로그인
        </Link>
      )}
    </>
  );

  // 로그인 사용자 뷰 렌더링
  const renderMemberView = () => (
    <>
      {/* 좌측: 로고 + 네비게이션 + 펫 추가 */}
      <div className="flex gap-1">
        <Logo withLink isMobile={isMobile} />
        {!isNative && <NavLinks />}
        {/* 웹에서만 메뉴바에 렌더링 */}
        {!isNative && !isMobile && !isRegisterPage && <AddPetButton />}
        {!isNative && !isMobile && !isRegisterPage && user?.isBiz && <AddPetBulkButton />}
      </div>

      {/* 우측: 검색 + 알림 + 설정 */}
      <div className="flex items-center gap-2">
        {!isMobile && (isFeedPage || isPetListPage) && (
          <div className="w-44">
            <SearchInput
              placeholder="개체 이름 검색"
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
          </div>
        )}
        {isMobile && (
          <>
            <NotificationIcon />
            {/*{!isNative && (*/}
            {!isNative && (
              <Link href="/settings" aria-label="설정">
                <Settings className="text-gray-500 dark:text-neutral-400" />
              </Link>
            )}
            {/*)}*/}
          </>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "flex h-[52px] items-center justify-between px-2",
        isShowcase
          ? "w-full"
          : cn(
              "dark:bg-background",
              !isPetDetailPage && "bg-background sticky top-0 left-0 z-20 w-full",
            ),
        isNative && "pr-4",
      )}
    >
      {isLoggedIn ? renderMemberView() : renderGuestView()}
    </div>
  );
};

export default Menubar;
