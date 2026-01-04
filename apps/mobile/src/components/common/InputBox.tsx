import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useColorScheme,
} from 'react-native';
import { InfoIcon } from 'lucide-react-native';

interface InputBoxProps extends TextInputProps {
  label: string;
  placeholder: string;
  errorMessage?: string;
  successMessage?: string;
  handlePress?: () => void;
  buttonDisabled?: boolean;
  buttonLabel?: string;
}

const InputBox = ({
  label,
  errorMessage,
  successMessage,
  buttonLabel,
  handlePress,
  buttonDisabled,
  ...props
}: InputBoxProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isDark && styles.labelDark]}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, isDark && styles.inputDark]}
          placeholderTextColor={isDark ? '#9CA3AF' : '#9E9E9E'}
          {...props}
        />
        {buttonLabel && (
          <Pressable
            style={[
              styles.button,
              isDark && styles.buttonDark,
              buttonDisabled &&
                (isDark ? styles.buttonDisabledDark : styles.buttonDisabled),
            ]}
            onPress={handlePress}
            disabled={buttonDisabled}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        )}
      </View>
      {errorMessage && (
        <View style={styles.messageContainer}>
          <InfoIcon size={16} color="#EF4444" />
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}
      {successMessage && (
        <View style={styles.messageContainer}>
          <InfoIcon size={16} color="#22C55E" />
          <Text style={styles.successMessage}>{successMessage}</Text>
        </View>
      )}
    </View>
  );
};

export default InputBox;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 6,
    color: '#000',
  },
  labelDark: {
    color: '#F3F4F6',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    fontSize: 15,
    flex: 1,
    height: 52,
    padding: 0,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    color: '#000',
  },
  inputDark: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
    color: '#F3F4F6',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorMessage: {
    color: '#EF4444',
  },
  successMessage: {
    color: '#22C55E',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  buttonDark: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonDisabledDark: {
    backgroundColor: '#4B5563',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
