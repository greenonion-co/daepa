"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { overlay } from "overlay-kit";
import Dialog from "../../components/Form/Dialog";
import { useAuth } from "@/hooks/useAuth";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowRight } from "lucide-react";
import { useLogout } from "@/hooks/useLogout";
import Link from "next/link";

const SettingList = () => {
  const { user, isLoggedIn } = useAuth();
  const { theme, setTheme } = useTheme();
  const { logout } = useLogout();

  const handleThemeChange = (isDark: boolean) => {
    setTheme(isDark ? "dark" : "light");
  };
  return (
    <ScrollArea className="h-full flex-1 pb-[60px]">
      <div className="flex flex-col p-4 pt-0">
        {isLoggedIn && (
          <>
            {/* 계정 정보 */}
            <div className="mb-6 text-sm">
              <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-400">내 정보</h3>
              <Item label="닉네임" content={user?.name} />
              <Item label="이메일" content={user?.email} />
              <Link
                href="/settings"
                className="group my-1.5 ml-auto flex w-fit items-center gap-1 py-1 text-xs font-[500] text-blue-500"
              >
                <span>상세보기</span>
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <Separator className="my-4" />
          </>
        )}

        <div className="mb-6 text-sm">
          <h3 className="mb-3 font-semibold text-gray-700 dark:text-gray-400">앱 설정</h3>

          <Item
            label="다크모드"
            content={
              <Switch disabled checked={theme === "dark"} onCheckedChange={handleThemeChange} />
            }
          />
        </div>

        <div className="mb-4 w-full text-center text-sm text-gray-600 dark:text-gray-400">
          {isLoggedIn ? (
            <>
              <Separator className="my-4" />

              <button
                type="button"
                onClick={() => {
                  overlay.open(({ isOpen, close, unmount }) => (
                    <Dialog
                      title="로그아웃"
                      description="정말 로그아웃 하시겠습니까?"
                      onExit={unmount}
                      isOpen={isOpen}
                      onCloseAction={close}
                      onConfirmAction={async () => {
                        await logout();
                        close();
                      }}
                    />
                  ));
                }}
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              href="/beta-closed"
              className="flex h-[42px] items-center justify-center rounded-xl bg-blue-600 text-[16px] font-bold text-white"
            >
              로그인
            </Link>
          )}
        </div>

        {/* 도움말 섹션 */}
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-neutral-800">
          <h4 className="mb-2 text-sm font-semibold text-blue-900 dark:text-neutral-300">
            도움이 필요하신가요?
          </h4>
          <p className="text-xs text-blue-800 dark:text-neutral-400">
            문의사항이 있으시면 고객센터로 연락해주세요.
          </p>
        </div>
      </div>
    </ScrollArea>
  );
};

export default SettingList;

export const Item = ({
  label,
  content,
}: {
  label?: string;
  content?: string | React.ReactNode;
}) => {
  return (
    <div className="flex justify-between">
      <div className="text-gray-600 dark:text-gray-400">{label}</div>
      <div>{content}</div>
    </div>
  );
};
