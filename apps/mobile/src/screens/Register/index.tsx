import { SafeAreaView } from 'react-native-safe-area-context';
import TopBar from '../../components/common/TopBar';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { useState } from 'react';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import SelectButtons from './SelectButtons';
import VoidSpace from '@/components/common/VoidSpace';
import NicknameInput from './NicknameInput';
import { DuplicateStatus } from '@/services/constant/input';
import axios from 'axios';
import { useAuthStore } from '@/store/auth';
import Toast from '@/components/common/Toast';

const RegisterScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [isRegisterPending, setIsRegisterPending] = useState(false);
  const [nickname, setNickname] = useState('');
  const [userType, setUserType] = useState('user');
  const [duplicateStatus, setDuplicateStatus] =
    useState<DuplicateStatus>('none');
  const { token } =
    useRoute<RouteProp<RootStackParamList, 'Register'>>().params;

  const handleSubmit = async () => {
    if (duplicateStatus !== 'available') return;
    try {
      setIsRegisterPending(true);

      const response = await axios.post(
        `http://localhost:4000/api/v1/user/init-info`,
        { name: nickname, isBiz: userType === 'biz' },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (response.data.success) {
        useAuthStore.getState().setAccessToken(token);
        Toast.show('회원정보 설정이 완료되었습니다.');
        navigation.replace('Tabs', {
          screen: 'Home',
        });
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsRegisterPending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="회원가입" />
      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <NicknameInput
          nickname={nickname}
          setNickname={setNickname}
          duplicateStatus={duplicateStatus}
          setDuplicateStatus={setDuplicateStatus}
        />

        <VoidSpace height={16} />
        <SelectButtons
          label="회원 유형"
          selectList={[
            { label: '일반 사용자', value: 'user' },
            { label: '사업자', value: 'biz' },
          ]}
          value={userType}
          setValue={setUserType}
        />

        <TouchableOpacity
          style={[
            styles.button,
            (isRegisterPending || duplicateStatus !== 'available') &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isRegisterPending || duplicateStatus !== 'available'}
        >
          <Text style={styles.submitText}>
            {isRegisterPending ? '처리중...' : '회원정보 설정 완료'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  inputContainer: {
    paddingHorizontal: 20,
    flex: 1,
  },
  button: {
    marginTop: 32,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  submitText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
