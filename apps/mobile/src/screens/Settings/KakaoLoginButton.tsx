import { Button } from 'react-native';
import { login, getProfile } from '@react-native-seoul/kakao-login';
import {
  authControllerGetToken,
  authControllerKakaoNative,
} from '@repo/api-client';
import { setupApiClient } from '../../utils/apiSetup';
import { useMutation } from '@tanstack/react-query';
import { UserDtoStatus } from '@repo/api-client';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';

const KakaoLoginButton = () => {
  const { navigateByStatus } = useLogin();

  const { mutateAsync: mutateGetToken } = useMutation({
    mutationFn: async (_status: UserDtoStatus) => {
      return authControllerGetToken();
    },
    onSuccess: async (data, status) => {
      navigateByStatus({ status, token: data.data.token });

      Loading.close();
    },
    onError: () => {
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const { mutateAsync: kakaoNativeLogin } = useMutation({
    mutationFn: authControllerKakaoNative,
    onSuccess: data => {
      mutateGetToken(data.data.status);
    },
    onError: error => {
      console.log(error);
      Loading.close();
    },
  });

  const handleKakaoLogin = async () => {
    Loading.show();
    try {
      setupApiClient();
      const kakaoLogin = await login();
      const userInfo = await getProfile();

      if (!userInfo.email) {
        Toast.show('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      kakaoNativeLogin({
        email: userInfo.email,
        id: String(userInfo.id),
        refreshToken: kakaoLogin.refreshToken,
      });
    } catch (e: any) {
      console.log(e);
      Loading.close();
    }
  };

  return <Button title="카카오톡 로그인" onPress={handleKakaoLogin} />;
};

export default KakaoLoginButton;
