import { View, Text, StyleSheet } from 'react-native';
import {
  authControllerDeleteAccount,
  authControllerSignOut,
  userControllerGetUserProfile,
} from '@repo/api-client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth';
import Loading from '../../components/common/Loading';
import Toast from '@/components/common/Toast';
import TouchableButton from '@/components/common/TouchableButton';
import Popup from '@/components/common/Popup';

const Profile = () => {
  const queryClient = useQueryClient();

  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: data => data.data.data,
  });

  const { mutateAsync: signOut, isPending: isSignOutPending } = useMutation({
    mutationFn: authControllerSignOut,
  });

  const { mutateAsync: deleteAccount, isPending: isDeleteAccountPending } =
    useMutation({
      mutationFn: authControllerDeleteAccount,
    });

  const handleDeleteAccount = async () => {
    if (isDeleteAccountPending) return;

    try {
      Loading.show();
      await deleteAccount();

      queryClient.removeQueries({
        queryKey: [userControllerGetUserProfile.name],
      });
      useAuthStore.getState().clear();
      Toast.show('회원 탈퇴에 성공했습니다.');
    } catch (error) {
      Toast.show('회원 탈퇴에 실패했습니다. 다시 시도해주세요.');
    } finally {
      Loading.close();
    }
  };

  const showDeleteAccountPopup = () => {
    Popup.show({
      title: '회원 탈퇴',
      description:
        '회원 탈퇴 하시겠습니까?\n회원 탈퇴 시 모든 정보가 삭제됩니다.',
      rightButton: {
        title: '회원 탈퇴',
        onPress: handleDeleteAccount,
      },
    });
  };

  const handleSignOut = async () => {
    if (isSignOutPending) return;

    try {
      Loading.show();
      await signOut();

      useAuthStore.getState().clear();
      queryClient.removeQueries({
        queryKey: [userControllerGetUserProfile.name],
      });

      Toast.show('로그아웃에 성공했습니다.');
    } catch (error) {
      Toast.show('로그아웃에 실패했습니다. 다시 시도해주세요.');
    } finally {
      Loading.close();
    }
  };

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <View>
        <Text>{userProfile?.isBiz ? '사업자' : '일반 사용자'}</Text>
        <Text>{userProfile?.name}</Text>
        <Text>{userProfile?.email}</Text>
      </View>

      <TouchableButton label="로그아웃" onPress={handleSignOut} />

      <TouchableButton label="회원 탈퇴" onPress={showDeleteAccountPopup} />
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
    paddingHorizontal: 20,
  },
});
