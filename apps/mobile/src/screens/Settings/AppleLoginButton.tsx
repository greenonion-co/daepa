import React from 'react';
import {
  Platform,
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
} from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import { useMutation } from '@tanstack/react-query';
import { authControllerAppleNative } from '@repo/api-client';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import Svg, { Path } from 'react-native-svg';

// 애플 아이콘 컴포넌트
const AppleIcon = () => (
  <Svg width={16} height={20} viewBox="0 0 814 1000" fill="none">
    <Path
      d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z"
      fill="white"
    />
  </Svg>
);

const AppleLoginButton = () => {
  const { navigateByStatus } = useLogin();
  const isAndroid = Platform.OS === 'android';

  const { mutateAsync: appleNativeLogin } = useMutation({
    mutationFn: authControllerAppleNative,
  });

  const handleAppleLoginOnAndroid = async () => {
    Loading.show();

    try {
      Toast.show('아직 지원되지 않는 기능입니다. 곧 제공될 예정입니다.');
      Loading.close();
      return;
    } catch (e) {
      console.log('handleAppleLoginOnIOS error', e);
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleAppleLoginOnIOS = async () => {
    Loading.show();

    let identityToken: string | null = null;
    let authorizationCode: string | null = null;
    let nonce: string | null = null;

    try {
      const body = {
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
        nonceEnabled: true,
      };

      const appleAuthRequestResponse = await appleAuth.performRequest(body);

      identityToken = appleAuthRequestResponse.identityToken;
      authorizationCode = appleAuthRequestResponse.authorizationCode;
      nonce = appleAuthRequestResponse.nonce;
      const email = appleAuthRequestResponse.email;

      if (!identityToken) {
        Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      if (!authorizationCode || !nonce) {
        Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
        return;
      }

      const appleRes = await appleNativeLogin({
        identityToken,
        email: email ?? undefined,
        authorizationCode: authorizationCode ?? undefined,
        nonce: nonce ?? undefined,
      });

      navigateByStatus({
        status: appleRes.data.status,
        token: appleRes.data.accessToken,
      });
    } catch (e) {
      console.log(e);
    } finally {
      Loading.close();
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={isAndroid ? handleAppleLoginOnAndroid : handleAppleLoginOnIOS}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <AppleIcon />
      </View>
      <Text style={styles.buttonText}>Apple로 시작하기</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: 52,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 16,
    height: 20,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AppleLoginButton;
