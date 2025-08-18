import { Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login, getProfile } from '@react-native-seoul/kakao-login';

import { setupApiClient } from '../../utils/apiSetup';
import { useMutation } from '@tanstack/react-query';
import {
  UserDtoStatus,
  authControllerGetToken,
  authControllerKakaoNative,
} from '@repo/api-client';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { tokenStorage } from '../../utils/tokenStorage';
import Profile from './Profile';
import { useState } from 'react';
import { RootStackParamList } from '../../navigation';
import { StackNavigationProp } from '@react-navigation/stack';

const SettingsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const { mutate: mutateGetToken } = useMutation({
    mutationFn: async (_status: UserDtoStatus) => {
      return authControllerGetToken();
    },
    onSuccess: async (data, status) => {
      switch (status) {
        case UserDtoStatus.PENDING:
          await tokenStorage.setToken(data.data.token);
          navigation.navigate('Register');
          break;
        case UserDtoStatus.ACTIVE:
          await tokenStorage.setToken(data.data.token);
          navigation.navigate('Tabs', {
            screen: 'Home',
          });
          break;
        default:
          navigation.navigate('Tabs', {
            screen: 'Settings',
          });
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

  useFocusEffect(() => {
    tokenStorage.getToken().then(token => {
      setIsLoggedIn(!!token);
    });
  });

  // useEffect(() => {
  //   tokenStorage.getToken().then(token => {
  //     setIsLoggedIn(!!token);
  //   });
  // }, []);

  return (
    <SafeAreaView>
      {isLoggedIn ? (
        <Profile />
      ) : (
        <Button title="카카오톡 로그인" onPress={handleKakaoLogin} />
      )}
    </SafeAreaView>
  );
};

export default SettingsScreen;
