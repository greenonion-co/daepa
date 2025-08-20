import { Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, getProfile } from '@react-native-seoul/kakao-login';
import {
  authControllerGetToken,
  authControllerKakaoNative,
} from '../../../../../packages/api-client/src/api';
import { setupApiClient } from '../../utils/apiSetup';
import { useMutation } from '@tanstack/react-query';
import { UserDtoStatus } from '@repo/api-client';
import { useNavigation } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import Profile from './Profile';

const SettingsScreen = () => {
  const navigation = useNavigation();

  const { mutate: mutateGetToken } = useMutation({
    mutationFn: async (_status: UserDtoStatus) => {
      return authControllerGetToken();
    },
    onSuccess: (data, status) => {
      switch (status) {
        case UserDtoStatus.PENDING:
          tokenStorage.setToken(data.data.token);
          navigation.navigate('Register');
          break;
        case UserDtoStatus.ACTIVE:
          tokenStorage.setToken(data.data.token);
          navigation.navigate('Home');
          break;
        default:
          navigation.navigate('Settings');
          break;
      }
    },
  });

  const { mutate: kakaoNativeLogin } = useMutation({
    mutationFn: authControllerKakaoNative,
    onSuccess: data => {
      mutateGetToken(data.data.status);
    },
    onError: error => {
      console.log(error);
    },
  });
  const handleKakaoLogin = async () => {
    try {
      setupApiClient();
      const kakaoLogin = await login();
      const userInfo = await getProfile();

      kakaoNativeLogin({
        email: userInfo.email ?? '',
        id: String(userInfo.id),
        refreshToken: kakaoLogin.refreshToken,
      });
    } catch (e: any) {}
  };

  return (
    <SafeAreaView>
      <Profile />
      <Button title="카카오톡 로그인" onPress={handleKakaoLogin} />
    </SafeAreaView>
  );
};

export default SettingsScreen;
