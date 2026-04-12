import { UserDtoStatus } from '@repo/api-client';
import { CommonActions, useNavigation } from '@react-navigation/native';
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
    // 모든 상태에서 accessToken 저장 (WebView와 Native 인증 상태 동기화)
    useAuthStore.getState().setAccessToken(token);

    switch (status) {
      case UserDtoStatus.PENDING:
        navigation.navigate('Main', {
          path: '/sign-in/register?_nativeTopBar=1&_hideTopBar=1',
        });
        break;
      case UserDtoStatus.ACTIVE:
        // 로그인 성공 시 네비게이션 스택 초기화 (뒤로가기 방지)
        // 개체관리(Pet) 탭으로 진입 — MemberMainTabs initialRouteName과 일치
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { screen: 'Pet' } }],
          }),
        );
        Toast.show('로그인에 성공했습니다.');
        break;
      default:
        // 기타 상태도 스택 초기화
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs', params: { screen: 'Settings' } }],
          }),
        );
        break;
    }
  };

  return {
    navigateByStatus,
  };
};

export default useLogin;
