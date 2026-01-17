import { createStackNavigator } from '@react-navigation/stack';
import PetDetailScreen from '../screens/Pet';
import Tabs from './Tabs';
import RegisterScreen from '../screens/Register';
import EmailRegisterScreen from '../screens/Register/email';
import LoginScreen from '../screens/Login';
import WebViewScreen from '../screens/WebView';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* 메인 탭 네비게이션 (로그인 없이도 접근 가능) */}
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Main" component={WebViewScreen} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />

      {/* 로그인/회원가입 플로우 */}
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailRegister" component={EmailRegisterScreen} />
    </Stack.Navigator>
  );
}
