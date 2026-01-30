import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useThemeStore } from '@/store/theme';
import Toast from './Toast';
import { impactHaptic } from '@/utils/haptic';

const SCREEN_HEIGHT = Dimensions.get('window').height;

export type AppMode = 'general' | 'admin';

interface ModeSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
}

const MODE_CONFIG = {
  general: { label: '일반', description: '피드와 마이페이지만 표시됩니다' },
  admin: {
    label: '관리자',
    description: '해칭룸, 분양룸 등 모든 기능을 사용할 수 있습니다',
  },
};

// 시트 전용 테마 색상
const sheetColors = {
  light: {
    surface: '#ffffff',
    border: '#e0e0e0',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  dark: {
    surface: '#1c1c1e',
    border: '#3a3a3c',
    text: '#f5f5f5',
    textSecondary: '#8e8e93',
  },
};

const ModeSelectionSheet = ({
  visible,
  onClose,
  currentMode,
  onModeChange,
}: ModeSelectionSheetProps) => {
  const theme = useThemeStore(state => state.theme);
  const colors = sheetColors[theme];
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // 햅틱 피드백
      impactHaptic('light');

      // 시트 슬라이드 업
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      // 시트 슬라이드 다운
      slideAnim.setValue(SCREEN_HEIGHT);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  const handleSelectMode = (mode: AppMode) => {
    if (mode !== currentMode) {
      onModeChange(mode);
      Toast.show(`${MODE_CONFIG[mode].label} 모드로 전환되었습니다`, 'check');
    }
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { backgroundColor: colors.surface },
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* 핸들 바 */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* 타이틀 */}
          <Text style={[styles.title, { color: colors.text }]}>모드 선택</Text>

          {/* 모드 옵션들 */}
          <View
            style={[
              styles.optionsContainer,
              { borderColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            {/* 일반 모드 */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                currentMode === 'general' && {
                  backgroundColor: theme === 'dark' ? '#ffffff10' : '#00000008',
                },
              ]}
              onPress={() => handleSelectMode('general')}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: colors.text },
                    currentMode === 'general' && styles.optionLabelSelected,
                  ]}
                >
                  {MODE_CONFIG.general.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {MODE_CONFIG.general.description}
                </Text>
              </View>
              {currentMode === 'general' && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: theme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  <Text
                    style={[
                      styles.checkText,
                      { color: theme === 'dark' ? '#000' : '#fff' },
                    ]}
                  >
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* 구분선 */}
            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            {/* 관리자 모드 */}
            <TouchableOpacity
              style={[
                styles.optionItem,
                currentMode === 'admin' && {
                  backgroundColor: theme === 'dark' ? '#ffffff10' : '#00000008',
                },
              ]}
              onPress={() => handleSelectMode('admin')}
              activeOpacity={0.7}
            >
              <View style={styles.optionContent}>
                <View style={styles.adminLabelRow}>
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.text },
                      currentMode === 'admin' && styles.optionLabelSelected,
                    ]}
                  >
                    {MODE_CONFIG.admin.label}
                  </Text>
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>★</Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.optionDescription,
                    { color: colors.textSecondary },
                  ]}
                >
                  {MODE_CONFIG.admin.description}
                </Text>
              </View>
              {currentMode === 'admin' && (
                <View
                  style={[
                    styles.checkBadge,
                    { backgroundColor: theme === 'dark' ? '#fff' : '#000' },
                  ]}
                >
                  <Text
                    style={[
                      styles.checkText,
                      { color: theme === 'dark' ? '#000' : '#fff' },
                    ]}
                  >
                    ✓
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ModeSelectionSheet;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 10,
    paddingTop: 12,
    paddingBottom: 60,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 16,
    overflow: 'hidden',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  divider: {
    height: 1,
  },
  optionContent: {
    flex: 1,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  optionLabelSelected: {
    fontWeight: '700',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  adminLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  adminBadge: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: '#f59e0b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminBadgeText: {
    fontSize: 9,
    color: '#fff',
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
