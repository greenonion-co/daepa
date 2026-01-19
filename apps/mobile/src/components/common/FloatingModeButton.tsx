import { useThemeStore } from '@/store/theme';
import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from './Toast';

export type AppMode = 'general' | 'admin';

interface FloatingModeButtonProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MODE_CONFIG = {
  general: { label: '일반', path: '/' },
  admin: { label: '관리자', path: '/pet' },
};

export default function FloatingModeButton({
  currentMode,
  onModeChange,
}: FloatingModeButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useThemeStore(state => state.theme);
  const animation = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  const toggleMenu = () => {
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const selectMode = (mode: AppMode) => {
    onModeChange(mode);
    toggleMenu();
    Toast.show(`${MODE_CONFIG[mode].label} 모드로 전환되었습니다`, 'check');
  };

  const generalStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -80],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
    opacity: animation,
  };

  const adminStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -40],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [0, 1],
          outputRange: [0.5, 1],
        }),
      },
    ],
    opacity: animation,
  };

  const rotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.3],
  });

  return (
    <>
      {isOpen && (
        <Animated.View
          style={[styles.backdrop, { opacity: backdropOpacity }]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <Pressable style={styles.backdropPressable} onPress={toggleMenu} />
        </Animated.View>
      )}
      <View style={[styles.container, { bottom: 80 + insets.bottom }]}>
        {/* 일반 모드 버튼 */}
        <Animated.View
          style={[styles.menuItem, generalStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[
              styles.menuButton,
              {
                backgroundColor:
                  currentMode === 'general'
                    ? theme === 'dark'
                      ? '#fff'
                      : '#000'
                    : theme === 'dark'
                      ? '#404040'
                      : '#c2c2c2',
              },
            ]}
            onPress={() => selectMode('general')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.menuButtonText,
                {
                  color:
                    currentMode === 'general'
                      ? theme === 'dark'
                        ? '#000'
                        : '#fff'
                      : theme === 'dark'
                        ? '#fff'
                        : '#000',
                },
              ]}
            >
              일반
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 관리자 모드 버튼 */}
        <Animated.View
          style={[styles.menuItem, adminStyle]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          <TouchableOpacity
            style={[
              styles.menuButton,
              {
                backgroundColor:
                  currentMode === 'admin'
                    ? theme === 'dark'
                      ? '#fff'
                      : '#000'
                    : theme === 'dark'
                      ? '#404040'
                      : '#c2c2c2',
              },
            ]}
            onPress={() => selectMode('admin')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.menuButtonText,
                {
                  color:
                    currentMode === 'admin'
                      ? theme === 'dark'
                        ? '#000'
                        : '#fff'
                      : theme === 'dark'
                        ? '#fff'
                        : '#000',
                },
              ]}
            >
              관리자
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 메인 FAB 버튼 */}
        <TouchableOpacity
          style={[
            styles.mainButton,
            { backgroundColor: theme === 'dark' ? '#fff' : '#000' },
          ]}
          onPress={toggleMenu}
          activeOpacity={0.8}
        >
          <Animated.Text
            style={[
              styles.mainButtonText,
              {
                transform: [{ rotate: rotation }],
                color: theme === 'dark' ? '#000' : '#fff',
              },
            ]}
          >
            +
          </Animated.Text>
        </TouchableOpacity>

        {/* 현재 모드 표시 */}
        <View style={styles.currentModeLabel}>
          <Text style={styles.currentModeLabelText}>
            {MODE_CONFIG[currentMode].label}
          </Text>
        </View>
      </View>
    </>
  );
}

export { MODE_CONFIG };

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
    zIndex: 998,
  },
  backdropPressable: {
    flex: 1,
  },
  container: {
    position: 'absolute',
    alignItems: 'center',
    right: '3%',
    zIndex: 999,
  },
  menuItem: {
    position: 'absolute',
    alignItems: 'center',
  },
  menuButton: {
    width: 55,
    height: 30,
    borderRadius: 20,
    backgroundColor: '#c2c2c2ff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4a4a4aff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuButtonActive: {
    backgroundColor: '#000',
  },
  menuButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  menuButtonTextActive: {
    color: '#fff',
  },
  mainButton: {
    width: 40,
    height: 40,
    borderRadius: 28,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  mainButtonText: {
    fontSize: 28,
    lineHeight: 28,
    color: '#fff',
    fontWeight: '300',
    textAlign: 'center',
  },
  currentModeLabel: {
    position: 'absolute',
    top: 45,
    backgroundColor: '#0b22b3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  currentModeLabelText: {
    fontSize: 10,
    color: '#ffffffff',
    fontWeight: 600,
  },
});
