import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  authControllerSignOut,
  userControllerGetUserProfile,
} from '@repo/api-client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { tokenStorage } from '../../utils/tokenStorage';

const Profile = () => {
  const { data: userProfile } = useQuery({
    queryKey: [userControllerGetUserProfile.name],
    queryFn: userControllerGetUserProfile,
    select: data => data.data.data,
  });

  const { mutate: signOut } = useMutation({
    mutationFn: authControllerSignOut,
    onSuccess: () => {
      tokenStorage.removeToken();
    },
  });

  if (!userProfile) return null;

  return (
    <View style={styles.container}>
      <Text>{userProfile?.isBiz ? '사업자' : '일반 사용자'}</Text>
      <Text>{userProfile?.name}</Text>
      <Text>{userProfile?.email}</Text>

      <TouchableOpacity style={styles.button} onPress={() => signOut()}>
        <Text style={styles.buttonText}>로그아웃</Text>
      </TouchableOpacity>
    </View>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  button: {
    height: 52,
    backgroundColor: 'black',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
