import { useNavigation } from '@react-navigation/native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface TopBarProps {
  title?: string;
  textButtonLabel?: string;
  textButtonPressed?: () => void;
}

const TopBar = ({
  title = '',
  textButtonLabel = '',
  textButtonPressed = () => {},
}: TopBarProps) => {
  const navigation = useNavigation();

  const onLeftButtonPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftButtonContainer}>
        <View style={styles.leftButtonContainer}>
          <Pressable onPress={onLeftButtonPress}>
            <Text>뒤로</Text>
          </Pressable>
        </View>
      </View>

      {!!title && <Text>{title}</Text>}

      <View style={styles.rightButtonContainer}>
        {!!textButtonLabel && (
          <Pressable onPress={textButtonPressed}>
            <Text>{textButtonLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftIcon: {
    width: 24,
    height: 24,
  },
  leftButtonContainer: {
    width: 40,
  },
  rightButtonContainer: {
    width: 40,
  },
});
