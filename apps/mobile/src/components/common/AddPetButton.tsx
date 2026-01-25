import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '@/types/navigation';
import { useAuthStore } from '@/store/auth';
import LoginPromoSheet from './LoginPromoSheet';

function AddPetButton() {
  const isLoggedIn = useAuthStore(state => !!state.user);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [showLoginPromo, setShowLoginPromo] = useState(false);

  const handlePress = useCallback(() => {
    if (isLoggedIn) {
      navigation.navigate('Main', { path: '/register/1' });
    } else {
      setShowLoginPromo(true);
    }
  }, [isLoggedIn, navigation]);

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={styles.container}
        accessibilityRole="button"
        accessibilityLabel="펫 추가하기"
      >
        <View style={styles.inner}>
          <Plus size={28} color="#fff" strokeWidth={2.5} />
        </View>
      </TouchableOpacity>

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
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
