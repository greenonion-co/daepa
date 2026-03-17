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

// WebView 화면 params
export type WebViewParams = {
  path?: string;
};

// Tab Navigator params (일반 모드)
export type GeneralTabParamList = {
  Home: WebViewParams | undefined;
  AddPet: undefined;
  Settings: undefined;
};

// Tab Navigator params (관리자 모드)
export type AdminTabParamList = {
  Home: WebViewParams | undefined;
  Hatching: undefined;
  AddPet: undefined;
  Adoption: undefined;
  Settings: undefined;
};

// 통합 Tab params
export type TabParamList = GeneralTabParamList & AdminTabParamList;

// 모든 화면의 params를 중앙에서 관리
export type RootStackParamList = {
  // Auth 관련
  Login: undefined;
  EmailRegister: AppleNativeLoginRequestDto;
  Register: { token: string };

  // Main (기존 네이티브)
  Tabs: { screen: string };
  PetDetail: { petId: string };

  // WebView (하이브리드)
  Main: WebViewParams | undefined;

  // QR 스캐너
  QrScanner: undefined;
};

// Navigation prop 타입들
export type RootStackNavigationProp = StackNavigationProp<RootStackParamList>;
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: StackNavigationProp<RootStackParamList, T>;
  route: RouteProp<RootStackParamList, T>;
};

export type EmailRegisterScreenProps = RootStackScreenProps<'EmailRegister'>;
export type RegisterScreenProps = RootStackScreenProps<'Register'>;
export type WebViewScreenProps = RootStackScreenProps<'Main'>;
