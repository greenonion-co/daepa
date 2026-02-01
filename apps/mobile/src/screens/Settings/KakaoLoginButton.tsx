import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { login, getProfile } from '@react-native-seoul/kakao-login';
import { authControllerKakaoNative } from '@repo/api-client';
import { useMutation } from '@tanstack/react-query';
import useLogin from '../../hooks/useLogin';
import Loading from '@/components/common/Loading';
import Toast from '@/components/common/Toast';
import Svg, { Path, G, ClipPath, Rect, Defs } from 'react-native-svg';

// 카카오 아이콘 컴포넌트
const KakaoIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 36 36" fill="none">
    <Defs>
      <ClipPath id="clip0">
        <Rect width={36} height={36} fill="white" />
      </ClipPath>
    </Defs>
    <G clipPath="url(#clip0)">
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.9999 1.2C8.05823 1.2 -0.00012207 7.42591 -0.00012207 15.1046C-0.00012207 19.88 3.11669 24.0899 7.86293 26.5939L5.86593 33.889C5.6895 34.5336 6.42671 35.0474 6.99281 34.6738L15.7466 28.8964C16.4853 28.9677 17.236 29.0093 17.9999 29.0093C27.9408 29.0093 35.9997 22.7836 35.9997 15.1046C35.9997 7.42591 27.9408 1.2 17.9999 1.2Z"
        fill="black"
      />
    </G>
  </Svg>
);

const KakaoLoginButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { navigateByStatus } = useLogin();

  const { mutateAsync: kakaoNativeLogin } = useMutation({
    mutationFn: authControllerKakaoNative,
  });

  const handleKakaoLogin = async () => {
    if (isLoading) return;
    setIsLoading(true);
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

      navigateByStatus({
        status: kakaoRes.data.status,
        token: kakaoRes.data.accessToken,
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
      setIsLoading(false);
      Loading.close();
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      onPress={handleKakaoLogin}
      activeOpacity={0.8}
      disabled={isLoading}
    >
      <View style={styles.iconContainer}>
        <KakaoIcon />
      </View>
      <Text style={styles.buttonText}>카카오로 시작하기</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE500',
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
    color: '#000000',
  },
});

export default KakaoLoginButton;
