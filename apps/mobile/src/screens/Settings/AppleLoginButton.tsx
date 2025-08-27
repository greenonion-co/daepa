import { StyleSheet } from 'react-native';
import { AppleButton } from '@invertase/react-native-apple-authentication';

import { useAppleNativeLogin } from '@/hooks/useAppleNativeLogin';

const AppleLoginButton = () => {
  const { handleAppleLogin } = useAppleNativeLogin();

  return (
    <AppleButton
      buttonType={AppleButton.Type.SIGN_IN}
      buttonStyle={AppleButton.Style.BLACK}
      cornerRadius={5}
      style={styles.button}
      onPress={handleAppleLogin}
    />
  );
};

export default AppleLoginButton;

const styles = StyleSheet.create({
  button: {
    width: 200,
    height: 50,
  },
});
