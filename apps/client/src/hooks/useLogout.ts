import { useAppRouter } from "@/hooks/useAppRouter";
import { toast } from "@/lib/toast";
import { useUserStore } from "@/app/(브리더스룸)/store/user";
import { isNativeApp } from "@/lib/native-bridge";

export const useLogout = () => {
  const router = useAppRouter();
  const onLogout = useUserStore((state) => state.onLogout);

  const logout = async () => {
    try {
      await onLogout();
      toast.success("로그아웃 되었습니다.");

      // 웹에서는 로그인 페이지로 이동 (네이티브는 store에서 LOGOUT 메시지 전송)
      if (!isNativeApp()) {
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("로그아웃 실패:", error);
      if (error instanceof Error) {
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      toast.error("로그아웃에 실패했습니다.");
    }
  };

  return { logout };
};
