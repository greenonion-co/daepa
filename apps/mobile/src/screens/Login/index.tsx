import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  useColorScheme,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackNavigationProp } from '@/types/navigation';
import KakaoLoginButton from '../Settings/KakaoLoginButton';
import AppleLoginButton from '../Settings/AppleLoginButton';
import GoogleLoginButton from '../Settings/GoogleLoginButton';

const LoginScreen = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const navigation = useNavigation<RootStackNavigationProp>();

  const handleLogoPress = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Tabs' }],
    });
  };

  return (
    <View style={[styles.background, isDark && styles.backgroundDark]}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={handleLogoPress}>
            <Text style={[styles.logoText, isDark && styles.logoTextDark]}>
              BREEDY
            </Text>
          </Pressable>
        </View>
        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.buttonContainer}>
              <GoogleLoginButton />
              <KakaoLoginButton />
              <AppleLoginButton />
            </View>
          </View>

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
  header: {
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  logoTextDark: {
    color: '#ffffff',
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
