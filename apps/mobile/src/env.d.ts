declare module 'react-native-config' {
  export interface NativeConfig {
    // 앱 식별자 — iOS 는 BUNDLE_ID, Android 는 ANDROID_APPLICATION_ID 를 각각 사용
    BUNDLE_ID: string;
    ANDROID_APPLICATION_ID: string;
    APP_NAME: string;

    // 카카오 SDK
    KAKAO_APP_KEY: string;

    // Google Sign-In
    GOOGLE_CLIENT_ID_IOS?: string;
    GOOGLE_CLIENT_ID_WEB?: string;
    GOOGLE_REVERSED_CLIENT_ID?: string;

    // 네트워크 설정
    LOCAL_IP?: string;
    SERVER_BASE_URL: string;
    CLIENT_BASE_URL: string;
    CDN_URL: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
