import { createStackNavigator } from '@react-navigation/stack';
import PetDetailScreen from '../screens/Pet';
import Tabs from './Tabs';
import RegisterScreen from '../screens/Register';
import EmailRegisterScreen from '../screens/Register/email';
import { RootStackParamList } from '@/types/navigation';

const Stack = createStackNavigator<RootStackParamList>();

export default function Navigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="EmailRegister" component={EmailRegisterScreen} />
    </Stack.Navigator>
  );
}
