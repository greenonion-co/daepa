import { SafeAreaView } from 'react-native-safe-area-context';
import InputBox from '../../components/common/InputBox';
import TopBar from '../../components/common/TopBar';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { userControllerVerifyEmail, UserDtoStatus } from '@repo/api-client';
import { useState } from 'react';
import { useRoute } from '@react-navigation/native';
import Toast from '@/components/common/Toast';
import {
  authControllerAppleNative,
  authControllerGetToken,
} from '@repo/api-client';
import Loading from '@/components/common/Loading';
import useLogin from '@/hooks/useLogin';
import VoidSpace from '@/components/common/VoidSpace';
import SelectButtons from './SelectButtons';
import NicknameInput from './NicknameInput';
import { DuplicateStatus } from '@/services/constant/input';

const RegisterScreen = () => {
  const { navigateByStatus } = useLogin();
  const { identityToken, authorizationCode, nonce } = useRoute().params as {
    identityToken: string;
    authorizationCode: string;
    nonce: string;
  };

  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('user');
  const [nickname, setNickname] = useState('');
  const [nicknameDuplicateStatus, setNicknameDuplicateStatus] =
    useState<DuplicateStatus>('none');
  const [emailDuplicateStatus, setEmailDuplicateStatus] =
    useState<DuplicateStatus>('none');

  const { mutateAsync: mutateVerifyEmail, isPending: isVerifyPending } =
    useMutation({
      mutationFn: userControllerVerifyEmail,
    });

  const { mutate: mutateGetToken } = useMutation({
    mutationFn: async (_status: UserDtoStatus) => {
      return authControllerGetToken();
    },
    onSuccess: async (data, status) => {
      navigateByStatus({ status, token: data.data.token });
      Loading.close();
    },
    onError: error => {
      console.log('getToken error', error);
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const { mutate: appleLogin } = useMutation({
    mutationFn: authControllerAppleNative,
    onSuccess: data => {
      mutateGetToken(data.data.status);
    },
    onError: error => {
      console.log('appleLogin error', error);
      Loading.close();
      Toast.show('로그인에 실패했습니다. 다시 시도해주세요.');
    },
  });

  const handleDuplicateCheck = async () => {
    if (!email) return;
    setEmailDuplicateStatus('checking');

    try {
      const response = await mutateVerifyEmail({ email });
      if (response.data.success) {
        setEmailDuplicateStatus('available');
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        setEmailDuplicateStatus('duplicate');
      } else {
        setEmailDuplicateStatus('none');
      }
    }
  };

  const handleSubmit = async () => {
    if (
      emailDuplicateStatus !== 'available' ||
      nicknameDuplicateStatus !== 'available'
    )
      return;

    Loading.show();
    appleLogin({
      identityToken,
      email,
      authorizationCode,
      nonce,
      name: nickname,
      isBiz: userType === 'biz',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="회원가입" />
      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.emailRegisterText}>회원가입 완료를 위해</Text>
          <Text style={styles.emailRegisterText}>이메일을 입력해주세요.</Text>
        </View>

        <InputBox
          autoFocus
          value={email}
          onChangeText={text => {
            setEmail(text);
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
              setEmailDuplicateStatus('error');
            } else {
              setEmailDuplicateStatus('none');
            }
          }}
          label="이메일"
          placeholder="이메일을 입력해주세요."
          errorMessage={
            emailDuplicateStatus === 'duplicate'
              ? '이미 사용중인 이메일입니다'
              : emailDuplicateStatus === 'error'
              ? '이메일 형식이 올바르지 않습니다'
              : undefined
          }
          successMessage={
            emailDuplicateStatus === 'available'
              ? '사용 가능한 이메일입니다'
              : undefined
          }
          buttonLabel={isVerifyPending ? '확인중...' : '중복확인'}
          handlePress={handleDuplicateCheck}
          buttonDisabled={isVerifyPending}
        />

        <VoidSpace height={16} />
        <NicknameInput
          nickname={nickname}
          setNickname={setNickname}
          duplicateStatus={nicknameDuplicateStatus}
          setDuplicateStatus={setNicknameDuplicateStatus}
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
            (isVerifyPending ||
              emailDuplicateStatus !== 'available' ||
              nicknameDuplicateStatus !== 'available') &&
              styles.buttonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={
            isVerifyPending ||
            emailDuplicateStatus !== 'available' ||
            nicknameDuplicateStatus !== 'available'
          }
        >
          <Text style={styles.submitText}>
            {isVerifyPending ? '처리중...' : '회원가입'}
          </Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  header: {
    marginTop: 8,
    marginBottom: 20,
    gap: 4,
  },
  emailRegisterText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
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
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
  segmentedWrap: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  segment: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  segmentActive: {
    borderColor: '#3B82F6',
    backgroundColor: '#DBEAFE',
  },
  segmentText: {
    color: '#374151',
    fontSize: 14,
  },
  segmentTextActive: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
});
