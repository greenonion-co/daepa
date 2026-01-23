"use client";
import { SIDEBAR_ITEMS } from "../constants";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, Plus, Settings } from "lucide-react";
import { useSearchKeywordStore } from "../store/searchKeyword";
import { useIsMobile } from "@/hooks/useMobile";
import SearchInput from "./SearchInput";
import Image from "next/image";
import { useUserStore } from "../store/user";
import { isNativeApp } from "@/lib/native-bridge";
import LoginPromoSheet from "./LoginPromoSheet";
import { overlay } from "overlay-kit";

const Menubar = ({ unreadCount }: { unreadCount: number }) => {
  const { isLoggedIn } = useUserStore();
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const { searchKeyword, setSearchKeyword } = useSearchKeywordStore();

  // 상태 플래그
  const isNative = isNativeApp();
  const isRegisterPage = pathname.includes("/register/");
  const isPetDetailPage = pathname?.startsWith("/pet/") ?? false;
  const isFeedPage = pathname === "/";
  const isPetListPage = pathname === "/pet";

  const openLoginPromoSheet = () => {
    overlay.open(({ isOpen, close }) => (
      <LoginPromoSheet
        isOpen={isOpen}
        onOpenChange={(open) => !open && close()}
        title="내 펫을 등록해보세요"
        description={
          <>
            <span className="text-gray-800">펫을 등록</span>하면
            <br />
            <span className="font-semibold text-blue-700">브리딩・혈통 인증・분양 관리</span>가
            가능해요!
          </>
        }
      />
    ));
  };

  // 펫 추가 버튼 컴포넌트
  const AddPetButton = ({ onClick, asLink }: { onClick?: () => void; asLink?: boolean }) => {
    const content = (
      <div className="flex w-fit items-center rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
          <Plus className="h-3 w-3" />
        </div>
        <span className="px-2 py-1 text-[14px] font-[500] text-blue-600 dark:text-blue-400">
          펫 추가하기
        </span>
      </div>
    );

    if (asLink) {
      return <Link href="/register/1">{content}</Link>;
    }
    return <button onClick={onClick}>{content}</button>;
  };

  // 검색 입력 컴포넌트
  const SearchInputBox = () => (
    <div className="w-45">
      <SearchInput
        placeholder="개체 이름 검색"
        value={searchKeyword}
        onKeyDown={(value) => setSearchKeyword(value)}
      />
    </div>
  );

  // 알림 아이콘 컴포넌트
  const NotificationIcon = () => (
    <Link href="/notifications" className="relative">
      <Mail className="text-gray-500 dark:text-neutral-400" />
      {unreadCount > 0 && (
        <div className="absolute -right-2 -top-2 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-red-500 text-[12px] font-medium text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </div>
      )}
    </Link>
  );

  // 로고 컴포넌트
  const Logo = ({ withLink = false }: { withLink?: boolean }) => {
    const logo = <Image src="/assets/logo.png" alt="브리디 로그인 로고" width={60} height={60} />;

    if (isNative && withLink) {
      return (
        <button
          type="button"
          className="mr-5 font-bold"
          onClick={() => window.scrollTo({ top: 0, behavior: "instant" })}
        >
          {logo}
        </button>
      );
    }

    if (withLink) {
      return (
        <Link href="/" className="mr-5 font-bold">
          {logo}
        </Link>
      );
    }
    return logo;
  };

  // 네비게이션 링크 컴포넌트
  const NavLinks = () => (
    <>
      {SIDEBAR_ITEMS.map((item) => (
        <Link
          key={item.title}
          href={item.url}
          className={cn(
            item.url === pathname
              ? "font-bold text-black dark:text-white"
              : "font-semibold text-gray-500 dark:text-gray-400",
            isMobile ? "px-1.5" : "px-3 py-1.5",
          )}
        >
          {item.title}
        </Link>
      ))}
    </>
  );

  // 게스트/피드 뷰 렌더링
  const renderGuestView = () => (
    <>
      <Logo withLink />
      {isFeedPage && <AddPetButton onClick={openLoginPromoSheet} />}
    </>
  );

  // 로그인 사용자 뷰 렌더링
  const renderMemberView = () => (
    <>
      {/* 좌측: 로고 + 네비게이션 + 펫 추가 */}
      <div className="flex items-center">
        <Logo withLink />
        {!isNative && <NavLinks />}
        {!isRegisterPage && <AddPetButton asLink />}
      </div>

      {/* 우측: 검색 + 알림 + 설정 */}
      <div className="flex items-center gap-2">
        {!isMobile && (isFeedPage || isPetListPage) && <SearchInputBox />}
        {isMobile && (
          <>
            <NotificationIcon />
            {!isNative && (
              <Link href="/settings">
                <Settings className="text-gray-500 dark:text-neutral-400" />
              </Link>
            )}
          </>
        )}
      </div>
    </>
  );

  return (
    <div
      className={cn(
        "dark:bg-background flex h-[52px] items-center justify-between px-2",
        !isPetDetailPage && "bg-background sticky left-0 top-0 z-50 w-full",
        isNative && "pr-4",
      )}
    >
      {isLoggedIn ? renderMemberView() : renderGuestView()}
    </div>
  );
};

export default Menubar;
