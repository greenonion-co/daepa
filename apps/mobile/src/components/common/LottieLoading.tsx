import React from 'react';
import AnimatedLottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';
import LoadingLottie from '@/assets/lotties/loading.json';
import SuccessLottie from '@/assets/lotties/success.json';
import FailLottie from '@/assets/lotties/fail.json';

interface LoadingProps {
  status?: 'loading' | 'success' | 'fail';
}

const LottieLoading = ({ status = 'loading' }: LoadingProps) => {
  const getLottieSource = () => {
    switch (status) {
      case 'loading':
        return LoadingLottie;
      case 'success':
        return SuccessLottie;
      case 'fail':
        return FailLottie;
      default:
        return LoadingLottie;
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedLottieView
        source={getLottieSource()}
        autoPlay
        loop={status === 'loading'}
        style={styles.lottie}
      />
    </View>
  );
};

export default LottieLoading;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lottie: {
    width: 100,
    height: 100,
  },
});
