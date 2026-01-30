import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsLoggedIn } from '@/hooks/useAuth';
import Profile from './Profile';
import KakaoLoginButton from './KakaoLoginButton';
import AppleLoginButton from './AppleLoginButton';
import { StyleSheet, View } from 'react-native';

const SettingsScreen = () => {
  const isLoggedIn = useIsLoggedIn();

  return (
    <SafeAreaView style={styles.container}>
      {isLoggedIn ? (
        <Profile />
      ) : (
        <View>
          <KakaoLoginButton />
          <AppleLoginButton />
        </View>
      )}
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
