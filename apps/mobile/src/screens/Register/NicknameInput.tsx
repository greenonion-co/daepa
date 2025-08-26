import InputBox from '@/components/common/InputBox';
import { DuplicateStatus } from '@/services/constant/input';
import { userControllerVerifyName } from '@repo/api-client';
import { useMutation } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { isAxiosError } from 'axios';

const NICKNAME_MAX_LENGTH = 15;
const NICKNAME_MIN_LENGTH = 2;

interface InputProps {
  nickname: string;
  setNickname: (nickname: string) => void;
  duplicateStatus: DuplicateStatus;
  setDuplicateStatus: (status: DuplicateStatus) => void;
}

const NicknameInput = ({
  nickname,
  setNickname,
  duplicateStatus,
  setDuplicateStatus,
}: InputProps) => {
  const { mutateAsync: mutateVerifyName, isPending: isVerifyPending } =
    useMutation({
      mutationFn: userControllerVerifyName,
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
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 409) {
        setDuplicateStatus('duplicate');
      } else {
        setDuplicateStatus('none');
      }
    }
  };

  return (
    <View>
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
          isVerifyPending ||
          nickname.length < NICKNAME_MIN_LENGTH ||
          nickname.length > NICKNAME_MAX_LENGTH
        }
      />
      <Text style={styles.helper}>
        {nickname.length}/{NICKNAME_MAX_LENGTH}
      </Text>
    </View>
  );
};

export default NicknameInput;

const styles = StyleSheet.create({
  helper: {
    marginTop: 8,
    fontSize: 12,
    color: '#9CA3AF',
  },
});
