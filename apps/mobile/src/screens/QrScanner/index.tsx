import React, { useRef, useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { RootStackNavigationProp } from '@/types/navigation';
import Toast from '@/components/common/Toast';

const SERVICE_DOMAINS = ['breedy.kr', 'www.breedy.kr'];

function extractPathFromQrUrl(decodedText: string): string | null {
  try {
    const url = new URL(decodedText);
    if (!__DEV__ && !SERVICE_DOMAINS.includes(url.hostname)) {
      return null;
    }
    return url.pathname + url.search + url.hash;
  } catch {
    if (decodedText.startsWith('/')) {
      return decodedText;
    }
    return null;
  }
}

export default function QrScannerScreen() {
  const navigation = useNavigation<RootStackNavigationProp>();
  const insets = useSafeAreaInsets();
  const scanLockRef = useRef(false);
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const [isActive, setIsActive] = useState(true);

  // 화면 포커스/블러 시 카메라 활성화/비활성화
  useFocusEffect(
    useCallback(() => {
      setIsActive(true);
      scanLockRef.current = false;
      return () => setIsActive(false);
    }, []),
  );

  // 권한 요청
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      if (scanLockRef.current) return;
      const value = codes[0]?.value;
      if (!value) return;

      scanLockRef.current = true;

      const path = extractPathFromQrUrl(value);
      if (path) {
        navigation.replace('Main', { path });
      } else {
        Toast.show('서비스에서 지원하지 않는 QR 코드입니다.');
        setTimeout(() => {
          scanLockRef.current = false;
        }, 2000);
      }
    },
  });

  const handleClose = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  // 권한 없음
  if (!hasPermission) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>카메라 권한이 필요합니다</Text>
          <Text style={styles.permissionDescription}>
            QR 코드를 스캔하려면 카메라 접근 권한을 허용해주세요.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:');
              } else {
                Linking.openSettings();
              }
            }}
          >
            <Text style={styles.permissionButtonText}>설정으로 이동</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.closeTextButton}
            onPress={handleClose}
          >
            <Text style={styles.closeTextButtonLabel}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 카메라 디바이스 없음
  if (!device) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>
            카메라를 사용할 수 없습니다
          </Text>
          <TouchableOpacity
            style={styles.closeTextButton}
            onPress={handleClose}
          >
            <Text style={styles.closeTextButtonLabel}>닫기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isActive}
        codeScanner={codeScanner}
      />

      {/* 오버레이 */}
      <View style={[styles.overlay, { paddingTop: insets.top }]}>
        {/* 상단 닫기 버튼 */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* 가이드 프레임 */}
        <View style={styles.guideContainer}>
          <View style={styles.guideFrame} />
          <Text style={styles.guideText}>QR 코드를 프레임 안에 맞춰주세요</Text>
        </View>
      </View>
    </View>
  );
}

const FRAME_SIZE = 250;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    padding: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideFrame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionDescription: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  closeTextButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  closeTextButtonLabel: {
    color: '#aaa',
    fontSize: 14,
  },
});
