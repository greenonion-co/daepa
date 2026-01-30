import React from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Mask, Rect, Circle } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// 원형 하이라이트 크기
const SPOTLIGHT_SIZE = 70;

interface ModeGuideOverlayProps {
  visible: boolean;
  onClose: () => void;
  onSpotlightLongPress?: () => void;
}

const ModeGuideOverlay = ({
  visible,
  onClose,
  onSpotlightLongPress,
}: ModeGuideOverlayProps) => {
  const insets = useSafeAreaInsets();

  // 탭바 높이 계산 (Tabs.tsx와 동일하게)
  const tabBarHeight = Platform.OS === 'android' ? 60 + insets.bottom : 80;

  // 마이페이지 탭 중심 위치 계산
  // 탭이 3개이고 마이페이지는 오른쪽 끝 (3번째)
  const tabCenterX = SCREEN_WIDTH - SCREEN_WIDTH / 6; // 오른쪽 탭 중앙
  const tabCenterY =
    SCREEN_HEIGHT -
    tabBarHeight / 2 -
    (Platform.OS === 'ios' ? 10 : 7 + insets.bottom);

  // 스포트라이트 위치
  const spotlightLeft = tabCenterX - SPOTLIGHT_SIZE / 2;
  const spotlightTop = tabCenterY - SPOTLIGHT_SIZE / 2;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.container} onPress={onClose}>
        {Platform.OS === 'ios' ? (
          // iOS: SVG 마스크 사용
          <Svg
            width={SCREEN_WIDTH}
            height={SCREEN_HEIGHT}
            style={StyleSheet.absoluteFill}
          >
            <Defs>
              <Mask id="spotlight-mask">
                <Rect width="100%" height="100%" fill="white" />
                <Circle
                  cx={tabCenterX}
                  cy={tabCenterY}
                  r={SPOTLIGHT_SIZE / 2}
                  fill="black"
                />
              </Mask>
            </Defs>
            <Rect
              width="100%"
              height="100%"
              fill="rgba(0, 0, 0, 0.8)"
              mask="url(#spotlight-mask)"
            />
          </Svg>
        ) : (
          // Android: 원형 테두리 방식 오버레이
          <View
            style={[
              styles.circularOverlay,
              {
                left: tabCenterX - SPOTLIGHT_SIZE / 2 - 2000,
                top: tabCenterY - SPOTLIGHT_SIZE / 2 - 2000,
              },
            ]}
          />
        )}

        {/* 스포트라이트 영역 (롱프레스 감지) */}
        <Pressable
          style={[
            styles.spotlightPressable,
            {
              left: spotlightLeft,
              top: spotlightTop,
              width: SPOTLIGHT_SIZE,
              height: SPOTLIGHT_SIZE,
              borderRadius: SPOTLIGHT_SIZE / 2,
            },
          ]}
          onLongPress={onSpotlightLongPress}
          delayLongPress={300}
        />

        {/* 툴팁 */}
        <View
          style={[
            styles.tooltipContainer,
            {
              left: spotlightLeft + SPOTLIGHT_SIZE / 2 - 190,
              top: spotlightTop - 100,
            },
          ]}
        >
          <View style={styles.tooltip}>
            <Text style={styles.tooltipTitle}>마이페이지를 길게 누르세요</Text>
            <Text style={styles.tooltipDescription}>
              일반/관리자 모드를 전환하여{`\n`}더 많은 기능을 사용할 수 있어요
            </Text>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

export default ModeGuideOverlay;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  circularOverlay: {
    position: 'absolute',
    width: SPOTLIGHT_SIZE + 4000,
    height: SPOTLIGHT_SIZE + 4000,
    borderRadius: (SPOTLIGHT_SIZE + 4000) / 2,
    borderWidth: 2000,
    borderColor: 'rgba(0, 0, 0, 0.8)',
    backgroundColor: 'transparent',
  },
  spotlightPressable: {
    position: 'absolute',
  },
  tooltipContainer: {
    position: 'absolute',
    alignItems: 'flex-end',
    width: 220,
  },
  tooltip: {
    backgroundColor: '#ffffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  tooltipTitle: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  tooltipDescription: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
});
