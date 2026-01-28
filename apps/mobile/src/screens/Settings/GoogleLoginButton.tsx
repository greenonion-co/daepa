import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import {
  GoogleSignin,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';
import {
  authControllerGetToken,
  authControllerGoogleNative,
} from '@repo/api-client';
import { useMutation } from '@tanstack/react-query';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import Svg, { Path } from 'react-native-svg';

// 구글 아이콘 컴포넌트
const GoogleIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const GoogleLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { navigateByStatus } = useLogin();

  const { mutateAsync: mutateGetToken } = useMutation({
    mutationFn: authControllerGetToken,
  });

  const { mutateAsync: googleNativeLogin } = useMutation({
    mutationFn: authControllerGoogleNative,
  });

  const handleGoogleLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
    Loading.show();
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        Toast.show('Google 로그인이 취소되었습니다.');
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        Toast.show('Google 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
        return;
      }

      const googleRes = await googleNativeLogin({
        idToken,
      });

      const tokenRes = await mutateGetToken();

      navigateByStatus({
        status: googleRes.data.status,
        token: tokenRes.data.token,
      });
    } catch (e) {
      if (e instanceof Error && !e.message.includes('SIGN_IN_CANCELLED')) {
        Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
        if (__DEV__) {
          console.log(e);
        }
      }
    } finally {
      setIsLoading(false);
      Loading.close();
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleGoogleLogin}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <View style={styles.iconContainer}>
        <GoogleIcon />
      </View>
      <Text style={styles.buttonText}>Google로 시작하기</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 18,
    height: 18,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F1F1F',
  },
});

export default GoogleLoginButton;
