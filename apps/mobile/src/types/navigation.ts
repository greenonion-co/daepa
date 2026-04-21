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

// Tab Navigator params (비로그인)
export type GuestTabParamList = {
  Feed: WebViewParams | undefined;
  Settings: undefined;
};

// Tab Navigator params (로그인 사용자)
export type MemberTabParamList = {
  Feed: WebViewParams | undefined;
  Pets: WebViewParams | undefined;
  Breeding: WebViewParams | undefined;
  Adoption: WebViewParams | undefined;
  Showroom: WebViewParams | undefined;
};

// 통합 Tab params
export type TabParamList = GuestTabParamList & MemberTabParamList;

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
