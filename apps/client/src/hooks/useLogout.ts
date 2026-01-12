import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";
import { tokenStorage } from "@/lib/tokenStorage";
import { AxiosError } from "axios";
import { useMutation } from "@tanstack/react-query";
import { authControllerSignOut } from "@repo/api-client";

export const useLogout = () => {
  const router = useRouter();
  const { mutateAsync: signOut } = useMutation({
    mutationFn: authControllerSignOut,
  });

  const logout = async () => {
    try {
      await signOut();
      tokenStorage.removeToken();
      toast.success("로그아웃 되었습니다.");
      router.replace("/sign-in");
    } catch (error) {
      if (error instanceof AxiosError) {
        toast.error(error.response?.data?.message ?? "로그아웃에 실패했습니다.");
      } else {
        toast.error("로그아웃에 실패했습니다.");
      }
    }
  };

  return { logout };
};
