import CautionIcon from '@/assets/svgs/toast/caution.svg';
import CheckIcon from '@/assets/svgs/toast/check.svg';
import InfoIcon from '@/assets/svgs/toast/info.svg';
import PointIcon from '@/assets/svgs/toast/point.svg';
import React, { Component } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type EmitterSubscription,
} from 'react-native';

type TOAST_ICON_TYPE = 'info' | 'check' | 'caution' | 'point' | 'none';

const TOAST_BOTTOM_INSET = 100;

const TOAST_DURATION = 2000;

const TOAST_MARGIN = 20;

interface ToastProps {}

export interface ToastContent {
  message?: string | null;
  icon?: TOAST_ICON_TYPE;
  inset?: number;
}

interface ToastState extends ToastContent {
  isVisible: boolean;
  keyboardShown: boolean;
  animationFlag: Animated.AnimatedValue;
  screenWidth: number;
  message: string | null;
}

const initialState: ToastState = {
  isVisible: false,
  message: null,
  inset: 0,
  keyboardShown: false,
  animationFlag: new Animated.Value(0),
  screenWidth: 0,
};

class Toast extends Component<ToastProps, ToastState> {
  state = initialState;

  static _ref: Toast | null = null;

  private keyboardShow?: EmitterSubscription;
  private keyboardHide?: EmitterSubscription;
  private screenWidth: number = 0;
  private timerID: ReturnType<typeof setTimeout> | null = null;

  componentDidMount() {
    const { width } = Dimensions.get('screen');
    this.setState({ screenWidth: width });

    const keyboardShowType =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const keyboardHideType =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    this.keyboardShow = Keyboard.addListener(keyboardShowType, () => {
      this.setState({ keyboardShown: true });
    });
    this.keyboardHide = Keyboard.addListener(keyboardHideType, () => {
      this.setState({ keyboardShown: false });
    });
  }

  componentWillUnmount() {
    this.keyboardShow?.remove();
    this.keyboardHide?.remove();

    if (this.timerID) {
      clearTimeout(this.timerID);
    }
  }

  componentDidUpdate() {
    const { width } = Dimensions.get('screen');
    if (this.state.screenWidth !== width) {
      this.setState({ screenWidth: width });
    }
  }

  timer = (): ReturnType<typeof setTimeout> =>
    setTimeout(() => {
      this.close();
    }, TOAST_DURATION);

  static setRef(ref: Toast | null) {
    Toast._ref = ref;
  }

  static show(message: string, icon?: TOAST_ICON_TYPE, inset?: number) {
    Toast._ref?.show(message, icon, inset);
  }

  show(message: string, icon?: TOAST_ICON_TYPE, inset?: number) {
    if (this.timerID) {
      clearTimeout(this.timerID);
    }

    const newState: ToastState = {
      ...this.state,
      isVisible: true,
      message,
      icon,
      inset,
      animationFlag: new Animated.Value(0),
    };

    this.setState(newState);
    this.showAnimation();

    this.timerID = this.timer();
  }

  close() {
    if (this.timerID) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }

    this.dismissAnimation();
  }

  showAnimation() {
    const { animationFlag } = this.state;
    Animated.timing(animationFlag, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.cubic,
    }).start();
  }

  dismissAnimation() {
    const { animationFlag } = this.state;
    Animated.timing(animationFlag, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.cubic,
    }).start(({ finished }) => {
      if (finished) {
        if (this.timerID) {
          clearTimeout(this.timerID);
          this.timerID = null;
        }
        this.setState(initialState);
      }
    });
  }

  getIcon() {
    const { icon } = this.state;
    switch (icon) {
      case 'info':
        return <InfoIcon />;
      case 'check':
        return <CheckIcon />;
      case 'caution':
        return <CautionIcon />;
      case 'point':
        return <PointIcon />;
      case 'none':
        return <></>;
      default:
        return <InfoIcon />;
    }
  }

  render() {
    const {
      isVisible,
      message,
      keyboardShown,
      animationFlag,
      inset: insetState,
    } = this.state;

    const inset =
      insetState === undefined
        ? keyboardShown
          ? 16
          : TOAST_BOTTOM_INSET
        : insetState;

    const width = this.screenWidth - TOAST_MARGIN * 2;

    return (
      <>
        {isVisible && (
          <KeyboardAvoidingView
            style={[styles.background, { bottom: inset }]}
            behavior="padding"
            keyboardVerticalOffset={inset}
          >
            <Animated.View
              style={{
                ...styles.container,
                opacity: animationFlag,
                transform: [
                  {
                    translateY: animationFlag.interpolate({
                      inputRange: [0, 1],
                      outputRange: [10, 0],
                    }),
                  },
                ],
                width,
              }}
            >
              <View>{this.getIcon()}</View>

              <Text style={styles.message}>{message}</Text>
            </Animated.View>
          </KeyboardAvoidingView>
        )}
      </>
    );
  }
}

export default Toast;

const styles = StyleSheet.create({
  background: {
    position: 'absolute',
    width: '100%',
    zIndex: 99999999999,
    paddingHorizontal: 10,
  },
  container: {
    padding: 20,
    backgroundColor: '#181818bf',
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconWrapper: {
    marginTop: 2,
  },
  message: {
    fontFamily: 'SpoqaHanSansNeo-Bold',
    color: '#fff',
    marginLeft: 6,
    flex: 1,
  },
});
