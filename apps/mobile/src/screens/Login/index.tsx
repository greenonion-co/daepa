import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, useColorScheme } from 'react-native';
import KakaoLoginButton from '../Settings/KakaoLoginButton';
import AppleLoginButton from '../Settings/AppleLoginButton';
import GoogleLoginButton from '../Settings/GoogleLoginButton';

const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.background, isDark && styles.backgroundDark]}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* 메인 카드 */}
          <View style={styles.card}>
            {/* 로고 이미지 */}
            <View style={styles.logoContainer}>
              <Text style={[styles.logoText, isDark && styles.logoTextDark]}>
                B.
              </Text>
            </View>

            {/* 로그인 버튼들 */}
            <View style={styles.buttonContainer}>
              <AppleLoginButton />
              <GoogleLoginButton />
              <KakaoLoginButton />
            </View>
          </View>

          {/* 추가 안내 */}
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            문제가 있으시면 고객센터로 문의해주세요
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundDark: {
    backgroundColor: '#18171C',
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 50,
  },
  logoText: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoTextDark: {
    color: '#f3f4f6',
  },
  buttonContainer: {
    gap: 8,
  },
  footerText: {
    marginTop: 24,
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
    textAlign: 'center',
  },
  footerTextDark: {
    color: '#9ca3af',
  },
});

export default LoginScreen;
