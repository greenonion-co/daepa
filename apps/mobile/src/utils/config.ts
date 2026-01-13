/**
 * 앱 설정 값들을 관리하는 Config
 * __DEV__를 사용해 개발/프로덕션 환경 자동 전환
 */

// 로컬 개발 시 사용할 IP (본인 컴퓨터의 IP로 변경 필요)
// 터미널에서 `ifconfig | grep "inet "` 로 확인
const LOCAL_IP = '';

const Config = __DEV__
  ? {
      // 개발 환경
      SERVER_BASE_URL: `http://${LOCAL_IP}:4000`,
      CLIENT_BASE_URL: `http://${LOCAL_IP}:3000`,
      CDN_URL: 'https://media.breedy.kr/cdn-cgi/image',
    }
  : {
      // 프로덕션 환경
      SERVER_BASE_URL: 'https://api.daepa.store',
      CLIENT_BASE_URL: 'https://daepa.store',
      CDN_URL: 'https://media.breedy.kr/cdn-cgi/image',
    };

export default Config;
