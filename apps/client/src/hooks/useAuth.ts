import { useUserStore } from "@/app/(브리더스룸)/store/user";

/**
 * 인증 상태를 확인하는 커스텀 훅
 *
 * @example
 * const { isLoggedIn, user, accessToken } = useAuth();
 *
 * if (!isLoggedIn) {
 *   // 로그인 필요
 * }
 */
export const useAuth = () => {
  const accessToken = useUserStore((state) => state.accessToken);
  const user = useUserStore((state) => state.user);

  return {
    /** 로그인 여부 (accessToken 기준) */
    isLoggedIn: !!accessToken,
    /** 유저 정보 */
    user,
    /** 액세스 토큰 */
    accessToken,
  };
};

/**
 * 로그인 여부만 확인하는 간단한 훅
 *
 * @example
 * const isLoggedIn = useIsLoggedIn();
 */
export const useIsLoggedIn = () => {
  return useUserStore((state) => !!state.accessToken);
};

/**
 * 유저 정보만 가져오는 훅
 *
 * @example
 * const user = useUser();
 */
export const useUser = () => {
  return useUserStore((state) => state.user);
};

export default useAuth;
