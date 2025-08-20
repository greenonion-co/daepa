import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { InfoIcon } from 'lucide-react-native';

interface InputBoxProps {
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
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputContainer}>
        <TextInput style={styles.input} {...props} />
        {buttonLabel && (
          <Pressable
            style={[styles.button, buttonDisabled && styles.buttonDisabled]}
            onPress={handlePress}
            disabled={buttonDisabled}
          >
            <Text style={styles.buttonText}>{buttonLabel}</Text>
          </Pressable>
        )}
      </View>
      {errorMessage && (
        <View style={styles.messageContainer}>
          <InfoIcon size={16} color="red" />
          <Text style={styles.errorMessage}>{errorMessage}</Text>
        </View>
      )}
      {successMessage && (
        <View style={styles.messageContainer}>
          <InfoIcon size={16} color="green" />
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
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorMessage: {
    color: 'red',
  },
  successMessage: {
    color: 'green',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
  },
  buttonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
