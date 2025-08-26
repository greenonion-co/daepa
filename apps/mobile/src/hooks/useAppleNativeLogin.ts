import {
  AppleNativeLoginRequestDto,
  authControllerAppleNative,
  authControllerGetToken,
  authControllerIssueAppleNonce,
} from '@repo/api-client';
import { useMutation } from '@tanstack/react-query';
import useLogin from './useLogin';

import { appleAuth } from '@invertase/react-native-apple-authentication';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import { isAxiosError } from 'axios';
import { useNavigation } from '@react-navigation/native';
import { RootStackNavigationProp } from '@/types/navigation';
import { Platform } from 'react-native';

export const useAppleNativeLogin = () => {
  const { navigateByStatus } = useLogin();
  const navigation = useNavigation<RootStackNavigationProp>();
  const { mutateAsync: issueNonce } = useMutation({
    mutationFn: authControllerIssueAppleNonce,
  });
  const { mutateAsync: appleLogin } = useMutation({
    mutationFn: authControllerAppleNative,
  });
  const { mutateAsync: getToken } = useMutation({
    mutationFn: authControllerGetToken,
  });

  const handleAppleLoginOnIOS = async (
    loginPayload: AppleNativeLoginRequestDto,
  ) => {
    try {
      Loading.show();

      const loginRes = await appleLogin(loginPayload);

      // 서버 세션/토큰 갱신
      const tokenRes = await getToken();

      // 로그인 상태에 따른 네비게이션
      navigateByStatus({
        status: loginRes.data.status,
        token: tokenRes.data.token,
      });
    } catch (error: unknown) {
      if (
        isAxiosError(error) &&
        error.response?.status === 422 &&
        error.response.data?.code === 600
      ) {
        if (!loginPayload) {
          Toast.show('로그인 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
          return;
        }
        navigation.navigate('EmailRegister', loginPayload);
        return;
      }

      if (isAxiosError(error) && error.response?.status === 400) {
        const errorMessage = error.response.data?.message;
        if (
          errorMessage?.includes('nonce') ||
          errorMessage?.includes('Nonce')
        ) {
          console.error('Nonce validation error:', errorMessage);
          Toast.show(
            '시간이 지나 인증 보안 검증에 실패했습니다. 다시 시도해주세요.',
          );
          navigation.navigate('Tabs', { screen: 'Settings' });
          return;
        }
        return;
      }
    } finally {
      Loading.close();
    }
  };

  //nonce 발급과 로그인 처리
  const issueNonceAndLogin = async () => {
    Loading.show();

    try {
      const nonceRes = await issueNonce();
      const { nonceId, rawNonce, hashedNonce } = nonceRes.data;

      if (!nonceId || !rawNonce || !hashedNonce) {
        console.error('Invalid nonce response:', nonceRes.data);
        Toast.show('로그인 준비 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      const appleAuthRequest = {
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
        nonceEnabled: true,
        nonce: rawNonce,
      };

      const { email, identityToken, authorizationCode } =
        await appleAuth.performRequest(appleAuthRequest);

      if (!identityToken || !authorizationCode) {
        Toast.show('Apple 인증에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      const loginPayload = {
        identityToken,
        email: email ?? undefined,
        authorizationCode,
        nonce: rawNonce, // 서버 검증용 원본 nonce
        nonceId, // 서버에서 nonce 식별용
      };

      await handleAppleLoginOnIOS(loginPayload);
    } catch (error) {
      // https://github.com/invertase/react-native-apple-authentication/blob/ac98c6243debe3fb2f5358cf5eafc7d186693829/lib/AppleAuthModule.js#L40
      if (!error?.toString().includes('1001')) {
        console.error('Apple login error:', error);
        Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      Loading.close();
    }
  };

  const handleAppleLoginOnAndroid = async () => {
    Loading.show();

    try {
      return Toast.show('아직 지원되지 않는 기능입니다. 곧 제공될 예정입니다.');

      // const REDIRECT_URI = `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/social-login`;
      // appleAuthAndroid.configure({
      //   clientId: process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? '',
      //   redirectUri: REDIRECT_URI,
      //   responseType: appleAuthAndroid.ResponseType.ALL,
      //   scope: appleAuthAndroid.Scope.ALL,
      // });
      // const { code, id_token, state, nonce } = await appleAuthAndroid.signIn();

      // if (!code || !id_token || !state || !nonce) {
      //   Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
      //   return;
      // }
    } catch (e) {
      console.log('handleAppleLoginOnIOS error', e);
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      Loading.close();
    }
  };

  const handleAppleLogin = () => {
    if (Platform.OS === 'ios') {
      issueNonceAndLogin();
    } else {
      handleAppleLoginOnAndroid();
    }
  };

  return { handleAppleLogin, handleAppleLoginOnIOS };
};
