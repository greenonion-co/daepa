import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppleNativeLoginRequestDto } from '@repo/api-client';

export type UserProfileParams = {
  userId: string;
  isEditing?: boolean;
};

export type ProductDetailParams = {
  productId: string;
  categoryId?: string;
};

// 모든 화면의 params를 중앙에서 관리
export type RootStackParamList = {
  // Auth 관련
  EmailRegister: AppleNativeLoginRequestDto;
  Register: { token: string };

  Tabs: { screen: string };
  PetDetail: { petId: string };
};

// Navigation prop 타입들
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

export type EmailRegisterScreenProps = RootStackScreenProps<'EmailRegister'>;
export type RegisterScreenProps = RootStackScreenProps<'Register'>;
