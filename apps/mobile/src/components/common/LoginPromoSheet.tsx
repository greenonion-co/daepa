import React, { Component } from 'react';
import {
  BackHandler,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
} from 'react-native';
import { CommonActions, NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '@/types/navigation';

interface LoginPromoSheetProps {}

interface LoginPromoSheetState {
  visible: boolean;
  slideAnim: Animated.Value;
}

/**
 * 로그인 유도 바텀 시트
 * LoginPromoSheet.show()로 호출
 */
class LoginPromoSheet extends Component<LoginPromoSheetProps, LoginPromoSheetState> {
  state: LoginPromoSheetState = {
    visible: false,
    slideAnim: new Animated.Value(300),
  };

  private backHandlerSub?: { remove: () => void };
  static _ref: LoginPromoSheet | null = null;
  static _navigationRef: NavigationContainerRef<RootStackParamList> | null = null;

  static setRef = (ref: LoginPromoSheet | null) => {
    LoginPromoSheet._ref = ref;
  };

  static setNavigationRef = (ref: NavigationContainerRef<RootStackParamList> | null) => {
    LoginPromoSheet._navigationRef = ref;
  };

  static show = () => {
    LoginPromoSheet._ref?.show();
  };

  static close = () => {
    LoginPromoSheet._ref?.close();
  };

  componentDidMount() {
    this.backHandlerSub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (this.state.visible) {
        this.close();
        return true;
      }
      return false;
    });
  }

  componentWillUnmount(): void {
    this.backHandlerSub?.remove();
    LoginPromoSheet._ref = null;
  }

  show = () => {
    this.setState({ visible: true }, () => {
      Animated.spring(this.state.slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    });
  };

  close = () => {
    Animated.timing(this.state.slideAnim, {
      toValue: 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      this.setState({ visible: false });
    });
  };

  handleLogin = () => {
    this.close();
    // 로그인 화면으로 이동
    if (LoginPromoSheet._navigationRef) {
      LoginPromoSheet._navigationRef.dispatch(
        CommonActions.navigate({ name: 'Login' })
      );
    }
  };

  render() {
    const { visible, slideAnim } = this.state;

    if (!visible) return null;

    return (
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={this.close}
        />
        <Animated.View
          style={[
            styles.sheetContainer,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* 이미지 */}
          <View style={styles.imageContainer}>
            <Image
              source={require('@/assets/images/lizard.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* 제목 */}
          <Text style={styles.title}>내 펫을 등록해보세요</Text>

          {/* 설명 */}
          <Text style={styles.description}>
            <Text style={styles.descriptionDark}>펫을 등록</Text>하면{'\n'}
            <Text style={styles.descriptionHighlight}>브리딩・혈통 인증・분양 관리</Text>가
            가능해요!
          </Text>

          {/* 시작하기 버튼 */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={this.handleLogin}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryButtonText}>시작하기</Text>
          </TouchableOpacity>

          {/* 다음에 할게요 버튼 */}
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={this.close}
            activeOpacity={0.6}
          >
            <Text style={styles.secondaryButtonText}>다음에 할게요</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }
}

export const openLoginPromoSheet = () => {
  LoginPromoSheet.show();
};

export default LoginPromoSheet;

const { height: HEIGHT, width: WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    width: WIDTH,
    height: HEIGHT,
    zIndex: 1000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  descriptionDark: {
    color: '#1f2937',
  },
  descriptionHighlight: {
    fontWeight: '600',
    color: '#1d4ed8',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#1f2937',
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
