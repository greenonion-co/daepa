import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, View, Text, Image, useColorScheme } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import KakaoLoginButton from '../Settings/KakaoLoginButton';
import AppleLoginButton from '../Settings/AppleLoginButton';
import GoogleLoginButton from '../Settings/GoogleLoginButton';

const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const gradientColors = isDark
    ? ['#18171C', '#18171C']
    : ['#e5cf94', '#ffffff'];

  return (
    <LinearGradient colors={gradientColors} style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          {/* 메인 카드 */}
          <View style={styles.card}>
            {/* 로그인 버튼들 */}
            <View style={styles.buttonContainer}>
              <GoogleLoginButton />
              <KakaoLoginButton />
              <AppleLoginButton />
            </View>
          </View>

          {/* 추가 안내 */}
          <Text style={[styles.footerText, isDark && styles.footerTextDark]}>
            문제가 있으시면 고객센터로 문의해주세요
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(31, 41, 55, 0.9)',
    marginBottom: 10,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
  },
  logoContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  logo: {
    width: 200,
    height: 200,
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
