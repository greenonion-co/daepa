/**
 * 앱 설정 값들을 관리하는 Config
 * react-native-config를 사용해 .env 파일에서 환경변수 로드
 *
 * 사용법:
 * - 개발 환경: .env 파일 사용 (기본)
 * - 프로덕션 환경: .env.production 파일 사용
 *
 * 로컬 IP 변경 시 .env 파일의 SERVER_BASE_URL, CLIENT_BASE_URL 수정
 */
import RNConfig from 'react-native-config';

const Config = {
  SERVER_BASE_URL: RNConfig.SERVER_BASE_URL ?? 'https://api.breedy.kr',
  CLIENT_BASE_URL: RNConfig.CLIENT_BASE_URL ?? 'https://breedy.kr',
  CDN_URL: RNConfig.CDN_URL ?? 'https://media.breedy.kr/cdn-cgi/image',
};

export default Config;
