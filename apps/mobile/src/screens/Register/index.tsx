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
import {
  userControllerCreateInitUserInfo,
  userControllerVerifyName,
} from '@repo/api-client';
import { useState } from 'react';

const NICKNAME_MAX_LENGTH = 15;
const NICKNAME_MIN_LENGTH = 2;

const RegisterScreen = () => {
  const [nickname, setNickname] = useState('');
  const [isBiz, setIsBiz] = useState(false);
  const [duplicateStatus, setDuplicateStatus] = useState<
    'none' | 'checking' | 'available' | 'duplicate'
  >('none');

  const { mutateAsync: mutateVerifyName, isPending: isVerifyPending } =
    useMutation({
      mutationFn: userControllerVerifyName,
    });

  const { mutateAsync: mutateRegister, isPending: isRegisterPending } =
    useMutation({
      mutationFn: userControllerCreateInitUserInfo,
    });

  const handleDuplicateCheck = async () => {
    if (
      !nickname ||
      nickname.length < NICKNAME_MIN_LENGTH ||
      nickname.length > NICKNAME_MAX_LENGTH
    )
      return;
    setDuplicateStatus('checking');
    try {
      const response = await mutateVerifyName({ name: nickname });
      if (response.data.success) {
        setDuplicateStatus('available');
      }
    } catch (error) {
      if (error.response?.status === 409) {
        setDuplicateStatus('duplicate');
      } else {
        setDuplicateStatus('none');
      }
    }
  };

  const handleSubmit = async () => {
    if (duplicateStatus !== 'available') return;
    try {
      const response = await mutateRegister({
        name: nickname,
        isBiz,
      });

      if (response.data.success) {
        // TODO: 성공 후 이동 처리
      }
    } catch (error) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="회원가입" />
      <KeyboardAvoidingView
        style={styles.inputContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <InputBox
          value={nickname}
          onChangeText={text => {
            setNickname(text);
            if (duplicateStatus !== 'none') {
              setDuplicateStatus('none');
            }
          }}
          label="닉네임"
          placeholder="닉네임을 입력해주세요."
          errorMessage={
            duplicateStatus === 'duplicate'
              ? '이미 사용중인 닉네임입니다'
              : undefined
          }
          successMessage={
            duplicateStatus === 'available'
              ? '사용 가능한 닉네임입니다'
              : undefined
          }
          buttonLabel={isVerifyPending ? '확인중...' : '중복확인'}
          handlePress={handleDuplicateCheck}
          buttonDisabled={
            isVerifyPending || nickname.length < NICKNAME_MIN_LENGTH
          }
        />
        <Text style={styles.helper}>
          {nickname.length}/{NICKNAME_MAX_LENGTH}
        </Text>

        <View style={styles.segmentedWrap}>
          <TouchableOpacity
            style={[styles.segment, !isBiz && styles.segmentActive]}
            onPress={() => setIsBiz(false)}
          >
            <Text
              style={[styles.segmentText, !isBiz && styles.segmentTextActive]}
            >
              일반 사용자
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segment, isBiz && styles.segmentActive]}
            onPress={() => setIsBiz(true)}
          >
            <Text
              style={[styles.segmentText, isBiz && styles.segmentTextActive]}
            >
              사업자
            </Text>
          </TouchableOpacity>
        </View>

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
