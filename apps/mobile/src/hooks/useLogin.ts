import { UserDtoStatus } from '@repo/api-client';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../store/auth';
import Toast from '@/components/common/Toast';
import { RootStackNavigationProp } from '@/types/navigation';

const useLogin = () => {
  const navigation = useNavigation<RootStackNavigationProp>();

  const navigateByStatus = ({
    status,
    token,
  }: {
    status: UserDtoStatus;
    token: string;
  }) => {
    switch (status) {
      case UserDtoStatus.PENDING:
        navigation.navigate('Register', {
          token,
        });
        break;
      case UserDtoStatus.ACTIVE:
        useAuthStore.getState().setAccessToken(token);
        navigation.navigate('Tabs', {
          screen: 'Home',
        });
        Toast.show('로그인에 성공했습니다.');
        break;
      default:
        navigation.navigate('Tabs', {
          screen: 'Settings',
        });
        break;
    }
  };

  return {
    navigateByStatus,
  };
};

export default useLogin;
