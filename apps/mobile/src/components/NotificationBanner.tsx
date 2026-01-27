import React, { useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/theme';

const AppIcon = require('../../assets/bootsplash/logo.png');

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  onPress?: () => void;
  onDismiss: () => void;
  duration?: number;
}

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  title,
  body,
  onPress,
  onDismiss,
  duration = 4000,
}) => {
  const insets = useSafeAreaInsets();
  const theme = useThemeStore(state => state.theme);
  const isDark = theme === 'dark';
  const translateY = useRef(new Animated.Value(-150)).current;

  const handleDismiss = useCallback(() => {
    Animated.timing(translateY, {
      toValue: -150,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDismiss();
    });
  }, [translateY, onDismiss]);

  useEffect(() => {
    if (visible) {
      // 슬라이드 다운
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }).start();

      // 자동 닫기
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, translateY, handleDismiss]);

  const handlePress = () => {
    handleDismiss();
    onPress?.();
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          paddingTop: insets.top + 8,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.content,
          { backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF' },
        ]}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <View style={styles.iconContainer}>
          <Image source={AppIcon} style={styles.icon} />
        </View>
        <View style={styles.textContainer}>
          <Text
            style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[styles.body, { color: isDark ? '#ABABAB' : '#666666' }]}
            numberOfLines={2}
          >
            {body}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 8,
  },
  content: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
    justifyContent: 'center',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  body: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
});

export default NotificationBanner;
