declare module 'react-native-config' {
  export interface NativeConfig {
    // 앱 식별자
    BUNDLE_ID: string;
    APP_NAME: string;

    // 카카오 SDK
    KAKAO_APP_KEY: string;

    // 네트워크 설정
    LOCAL_IP?: string;
    SERVER_BASE_URL: string;
    CLIENT_BASE_URL: string;
    CDN_URL: string;
  }

  export const Config: NativeConfig;
  export default Config;
}
