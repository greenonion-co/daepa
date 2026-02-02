import { useAuthStore } from '@/store/auth';

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
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);

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
  return useAuthStore(state => !!state.accessToken);
};

/**
 * 유저 정보만 가져오는 훅
 *
 * @example
 * const user = useUser();
 */
export const useUser = () => {
  return useAuthStore(state => state.user);
};

export default useAuth;
