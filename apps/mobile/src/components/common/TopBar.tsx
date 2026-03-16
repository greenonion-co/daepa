import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeStore, themeColors } from '@/store/theme';

interface TopBarProps {
  title?: string;
  textButtonLabel?: string;
  textButtonPressed?: () => void;
  showBackButton?: boolean;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  backgroundColor?: string;
}

const TopBar = ({
  title = '',
  textButtonLabel = '',
  textButtonPressed = () => {},
  showBackButton = true,
  leftComponent,
  rightComponent,
  onBackPress,
  backgroundColor,
}: TopBarProps) => {
  const navigation = useNavigation();
  const theme = useThemeStore(state => state.theme);
  const colors = themeColors[theme];

  const onLeftButtonPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: backgroundColor ?? colors.background,
          borderBottomColor: colors.tabBarBorder,
        },
      ]}
    >
      <View style={styles.leftButtonContainer}>
        {leftComponent ? (
          leftComponent
        ) : showBackButton && navigation.canGoBack() ? (
          <Pressable onPress={onLeftButtonPress}>
            <ChevronLeft color={colors.tabBarActive} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.titleContainer}>
        {!!title && (
          <Text style={[styles.titleText, { color: colors.tabBarActive }]}>
            {title}
          </Text>
        )}
      </View>

      <View style={styles.rightButtonContainer}>
        {rightComponent ? (
          rightComponent
        ) : textButtonLabel ? (
          <Pressable onPress={textButtonPressed}>
            <Text style={styles.buttonText}>{textButtonLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 56,
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  leftButtonContainer: {
    width: 60,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
  },
  rightButtonContainer: {
    width: 60,
    alignItems: 'flex-end',
  },
  buttonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});
