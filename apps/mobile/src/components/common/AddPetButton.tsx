import React, { useState, useCallback, useRef } from 'react';
import { StyleSheet, Pressable, Animated } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useIsLoggedIn } from '@/hooks/useAuth';
import LoginPromoSheet from './LoginPromoSheet';

function AddPetButton() {
  const isLoggedIn = useIsLoggedIn();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showLoginPromo, setShowLoginPromo] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    if (isLoggedIn) {
      navigation.navigate('Main', { path: '/register/1?_nativeTopBar=1' });
    } else {
      setShowLoginPromo(true);
    }
  }, [isLoggedIn, navigation]);

  const handlePressIn = useCallback(() => {
    Animated.timing(scale, {
      toValue: 0.9,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handlePressOut = useCallback(() => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  return (
    <>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel="펫 추가하기"
      >
        <Animated.View style={[styles.inner, { transform: [{ scale }] }]}>
          <Plus size={28} color="#fff" strokeWidth={2.5} />
        </Animated.View>
      </Pressable>

      <LoginPromoSheet
        visible={showLoginPromo}
        onClose={() => setShowLoginPromo(false)}
      />
    </>
  );
}

export default AddPetButton;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2D3645',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2D3645',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
