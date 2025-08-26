import { BackHandler, Dimensions, StyleSheet, View } from 'react-native';
import type { NativeEventSubscription } from 'react-native';
import React, { Component } from 'react';
import LottieLoading from './LottieLoading';

interface LoadingProps {
  status?: 'loading' | 'success' | 'fail';
}

interface LoadingState {
  isLoading: boolean;
  status?: 'loading' | 'success' | 'fail';
}

const initialState: LoadingState = {
  isLoading: false,
  status: 'loading',
};

class Loading extends Component<LoadingProps, LoadingState> {
  state = initialState;

  static _ref: Loading | null = null;
  private backHandlerSub?: NativeEventSubscription;

  componentDidMount() {
    this.backHandlerSub = BackHandler.addEventListener(
      'hardwareBackPress',
      this.backAction,
    );
  }

  componentWillUnmount() {
    this.backHandlerSub?.remove();

    if (Loading._ref === this) {
      Loading._ref = null;
    }
  }

  static setRef(ref: Loading | null) {
    Loading._ref = ref;
  }

  static show() {
    Loading._ref?.show();
  }

  static close() {
    Loading._ref?.close();
  }

  static update(props: LoadingProps) {
    Loading._ref?.update(props);
  }

  show() {
    this.setState({ isLoading: true });
  }

  close() {
    this.setState(initialState);
  }

  update({ status = 'loading' }: LoadingProps) {
    this.setState({ isLoading: true, status });
  }

  backAction = (): boolean => {
    const { isLoading } = this.state;
    if (isLoading) {
      this.close();
      return true;
    }
    return false;
  };

  render(): React.ReactNode {
    const { isLoading, status } = this.state;
    return (
      <>
        {isLoading ? (
          <View style={styles.backDrop}>
            <LottieLoading status={status} />
          </View>
        ) : (
          <></>
        )}
      </>
    );
  }
}

export default Loading;

const { width: WIDTH } = Dimensions.get('screen');

const styles = StyleSheet.create({
  backDrop: {
    width: WIDTH,
    bottom: 0,
    backgroundColor: '#00000050',
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1005,
  },
});
