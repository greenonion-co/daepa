import { Button } from 'react-native';
import { login, getProfile } from '@react-native-seoul/kakao-login';
import {
  authControllerGetToken,
  authControllerKakaoNative,
} from '@repo/api-client';
import { useMutation } from '@tanstack/react-query';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';

const KakaoLoginButton = () => {
  const { navigateByStatus } = useLogin();

  const { mutateAsync: mutateGetToken } = useMutation({
    mutationFn: authControllerGetToken,
  });

  const { mutateAsync: kakaoNativeLogin } = useMutation({
    mutationFn: authControllerKakaoNative,
  });

  const handleKakaoLogin = async () => {
    Loading.show();
    try {
      const kakaoLogin = await login();
      const userInfo = await getProfile();

      if (!userInfo.email) {
        Toast.show('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      const kakaoRes = await kakaoNativeLogin({
        email: userInfo.email,
        id: String(userInfo.id),
        refreshToken: kakaoLogin.refreshToken,
      });

      const tokenRes = await mutateGetToken();

      navigateByStatus({
        status: kakaoRes.data.status,
        token: tokenRes.data.token,
      });
    } catch (e) {
      if (
        e instanceof Error &&
        !e.message.includes('KakaoSDKCommon.SdkError')
      ) {
        Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
        console.log(e);
      }
    } finally {
      Loading.close();
    }
  };

  return <Button title="카카오톡 로그인" onPress={handleKakaoLogin} />;
};

export default KakaoLoginButton;
