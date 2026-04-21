import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

/**
 * @deprecated 현재 사용처 없음. `pet/[petId]/page.tsx`에서 제거됨 (매 SSR마다
 * `/auth/token` 호출 비용 제거 목적). 페이지 데이터 로드는 Client(React Query +
 * localStorage Bearer)로 수행하는 패턴이 기본이 되었음.
 *
 * 향후 "공개 API만으로 불가능하고 소유자 본인 비공개 리소스의 server-side
 * metadata가 필수"인 희소한 경우에만 복원 검토. 그런 경우에도 가능하면 metadata
 * 간소화로 회피를 우선 고려할 것.
 *
 * 서버 컴포넌트에서 인증된 API 요청을 위한 헤더를 생성합니다.
 * refreshToken 쿠키를 사용하여 accessToken을 획득한 후 Authorization 헤더를 반환.
 *
 * cache()로 감싸져 있어 같은 렌더링 사이클 내에서는 토큰 획득 요청이 1회만 실행됩니다.
 */
export const getServerRequestHeaders = cache(async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return {};
  }

  try {
    if (!BASE_URL) {
      throw new Error("NEXT_PUBLIC_SERVER_BASE_URL is not defined");
    }

    const response = await fetch(`${BASE_URL}/api/auth/token`, {
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });
    if (response.ok) {
      const data = await response.json();
      const accessToken = data.token;
      return { Authorization: `Bearer ${accessToken}` };
    }
  } catch (error) {
    console.error("Failed to get access token for server request:", error);
  }

  return {};
});
