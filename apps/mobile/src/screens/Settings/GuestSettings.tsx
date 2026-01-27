import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '@/types/navigation';

const GuestSettingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['top']}
    >
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          브리디 회원 가입하면
        </Text>
        <Text style={[styles.title, isDark && styles.titleDark]}>
          나만의 펫을 등록하고 관리할 수 있어요!
        </Text>

        <TouchableOpacity
          style={[styles.loginButton, isDark && styles.loginButtonDark]}
          onPress={handleLoginPress}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.loginButtonText,
              isDark && styles.loginButtonTextDark,
            ]}
          >
            로그인 / 회원가입
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#18171C',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: -60,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  titleDark: {
    color: '#ffffff',
  },
  loginButton: {
    marginTop: 24,
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  loginButtonDark: {
    backgroundColor: '#fff',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  loginButtonTextDark: {
    color: '#000',
  },
});

export default GuestSettingsScreen;
