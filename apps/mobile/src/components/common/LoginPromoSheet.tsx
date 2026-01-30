import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

const SCREEN_HEIGHT = Dimensions.get('window').height;

interface LoginPromoSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LoginPromoSheet = ({ visible, onClose }: LoginPromoSheetProps) => {
  const navigation = useNavigation();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // 백드롭 페이드 인 + 시트 슬라이드 업
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
      ]).start();
    } else {
      // 초기화
      slideAnim.setValue(SCREEN_HEIGHT);
      backdropAnim.setValue(0);
    }
  }, [visible, slideAnim, backdropAnim]);

  const handleClose = () => {
    // 백드롭 페이드 아웃 + 시트 슬라이드 다운
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleLogin = () => {
    handleClose();
    // 약간의 딜레이 후 네비게이션 (애니메이션 완료 후)
    setTimeout(() => {
      navigation.dispatch(CommonActions.navigate({ name: 'Login' }));
    }, 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 애니메이션 백드롭 */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* 슬라이드 업 시트 */}
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* 이미지 */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/lizard_face.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>내 펫을 등록해보세요</Text>

          {/* 설명 */}
          <Text style={styles.description}>
            펫을 등록하고{'\n'}
            <Text style={styles.descriptionHighlight}>
              브리딩・혈통 인증・분양 관리
            </Text>
            {'\n'}기능을 이용해보세요!
          </Text>

          {/* 시작하기 버튼 */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>

          {/* 다음에 할게요 버튼 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleClose}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>다음에 할게요</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default LoginPromoSheet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#000000ff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  descriptionHighlight: {
    fontWeight: '600',
    color: '#1d4ed8',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 8,
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
  },
});
