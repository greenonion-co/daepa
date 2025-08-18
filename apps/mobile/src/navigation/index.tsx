import { createStackNavigator } from '@react-navigation/stack';
import PetDetailScreen from '../screens/Pet';
import Tabs from './Tabs';
import RegisterScreen from '../screens/Register';

const Stack = createStackNavigator<RootStackParamList>();

export type RootStackParamList = {
  Tabs: { screen: string };
  PetDetail: { petId: string };
  Register: undefined;
};

export default function Navigation() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="PetDetail" component={PetDetailScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}
