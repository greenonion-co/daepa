import React from 'react';
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CommonActions, useNavigation } from '@react-navigation/native';

interface LoginPromoSheetProps {
  visible: boolean;
  onClose: () => void;
}

const LoginPromoSheet = ({ visible, onClose }: LoginPromoSheetProps) => {
  const navigation = useNavigation();

  const handleLogin = () => {
    onClose();
    navigation.dispatch(CommonActions.navigate({ name: 'Login' }));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.sheetContainer}>
          {/* 이미지 */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/lizard_new.png')}
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
            onPress={onClose}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>다음에 할게요</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default LoginPromoSheet;

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
  descriptionDark: {},
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
