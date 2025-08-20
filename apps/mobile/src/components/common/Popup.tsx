import React, { Component, ReactNode } from 'react';
import {
  BackHandler,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import VoidSpace from './VoidSpace';

interface PopupProps {}
export interface PopupContent {
  title: string | null;
  description: string | null;
  contents?: () => ReactNode;
  leftButton?: {
    title?: string;
    onPress?: () => void;
  };
  rightButton?: {
    title?: string;
    onPress?: () => void;
  };
}

/**
 * 전역에서 활용되는 팝업 컴포넌트입니다.
 * 상단부터 title -> description -> contents -> button 순서로 렌더링됩니다.
 * description에서 줄바꿈 시 `... \n ...`으로 넣어주세요.
 */
interface PopupState extends PopupContent {
  visible?: boolean;
}

const initialState = {
  visible: false,
  title: null,
  description: null,
  contents: () => <></>,
  leftButton: {
    title: '취소',
    onPress: () => {},
  },
  rightButton: {
    title: '확인',
    onPress: () => {},
  },
};

class Popup extends Component<PopupProps, PopupState> {
  state = initialState;

  screenWidth: number = 0;

  static _ref: Popup | null = null;

  static setRef = (ref: Popup | null) => {
    Popup._ref = ref;
  };

  static show = (props: PopupContent) => {
    Popup._ref?.show(props);
  };

  static close = () => Popup._ref?.close();

  componentDidMount() {
    const { width } = Dimensions.get('screen');
    this.screenWidth = width;
    BackHandler.addEventListener('hardwareBackPress', () => {
      const { visible } = this.state;
      if (visible) {
        return true;
      }
    });
  }

  static update = (props: PopupContent) => Popup._ref?.update(props);

  show = (props: PopupContent) => {
    this.setState({ visible: true, ...props });
  };

  close = () => {
    this.setState(initialState);
  };

  update = (props: PopupContent) => {
    this.setState({ visible: true, ...props });
  };

  isButtonExist(buttonPosition: 'left' | 'right') {
    const { leftButton, rightButton } = this.state;
    if (buttonPosition === 'left') {
      return !!leftButton;
    }
    return !!rightButton;
  }

  render() {
    const { visible, title, description, contents, leftButton, rightButton } =
      this.state;

    if (!visible) return <></>;
    return (
      <View style={[styles.backDrop, { width: this.screenWidth }]}>
        <View
          style={styles.popUpContainer}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.contentContainer}>
            {title ? (
              <Text style={styles.titleTX}>{title}</Text>
            ) : (
              <VoidSpace height={16} />
            )}
            {!!description && (
              <Text style={styles.descriptionTX}>{description}</Text>
            )}
            {!!contents && contents()}
          </View>
          <View style={styles.horizontalDivider} />
          <View style={styles.buttonContainer}>
            {this.isButtonExist('left') && (
              <TouchableOpacity
                style={styles.leftButton}
                onPress={() => {
                  this.close();
                  leftButton?.onPress();
                }}
              >
                <Text style={styles.leftButtonTX}>{leftButton?.title}</Text>
              </TouchableOpacity>
            )}
            {this.isButtonExist('left') && (
              <View style={styles.verticalDivider} />
            )}
            {this.isButtonExist('right') && (
              <TouchableOpacity
                style={styles.rightButton}
                onPress={() => {
                  this.close();
                  rightButton?.onPress();
                }}
              >
                <Text style={styles.rightButtonTX}>{rightButton?.title}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  }
}

export default Popup;

const { height: HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  backDrop: {
    width: '100%',
    height: HEIGHT,
    position: 'absolute',
    zIndex: 1000,
    backgroundColor: '#00000050',
    alignItems: 'center',
    justifyContent: 'center',
  },
  popUpContainer: {
    backgroundColor: 'white',
    width: 288,
    borderBottomWidth: 0,
    borderRadius: 4,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  titleTX: {
    textAlign: 'center',
    paddingVertical: 16,
  },
  descriptionTX: {
    textAlign: 'center',
    color: '#808080',
    paddingBottom: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    flex: 1,
  },
  leftButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 17,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 0,
  },
  rightButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 17,
    borderBottomRightRadius: 4,
    borderBottomLeftRadius: 0,
  },
  leftButtonTX: {
    color: '#808080',
  },
  rightButtonTX: {
    fontWeight: 'bold',
  },
  verticalDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  horizontalDivider: {
    height: 1,
    backgroundColor: '#E0E0E0',
  },
});
