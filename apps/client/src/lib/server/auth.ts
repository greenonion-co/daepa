import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

/**
 * 서버 컴포넌트에서 인증된 API 요청을 위한 헤더를 생성합니다.
 *
 * refreshToken 쿠키를 사용하여 accessToken을 획득한 후
 * Authorization 헤더를 반환합니다.
 *
 * cache()로 감싸져 있어 같은 렌더링 사이클 내에서는
 * 토큰 획득 요청이 1회만 실행됩니다.
 */
export const getServerRequestHeaders = cache(async (): Promise<Record<string, string>> => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) {
    return {};
  }

  try {
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
