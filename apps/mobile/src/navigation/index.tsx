import { createStackNavigator } from '@react-navigation/stack';
import Tabs from './Tabs';
import LoginScreen from '../screens/Login';
import WebViewScreen from '../screens/WebView';
import QrScannerScreen from '../screens/QrScanner';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 메인 탭 네비게이션 (로그인 없이도 접근 가능) */}
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Main" component={WebViewScreen} />

      {/* 로그인/회원가입 플로우 */}
      <Stack.Screen name="Login" component={LoginScreen} />

      {/* QR 스캐너 */}
      <Stack.Screen name="QrScanner" component={QrScannerScreen} />
    </Stack.Navigator>
  );
}
