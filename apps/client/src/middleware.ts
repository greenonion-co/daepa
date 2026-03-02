import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // /@username → /showroom/username 리라이트
  if (pathname.startsWith('/@')) {
    const username = pathname.slice(2);
    if (username) {
      const url = request.nextUrl.clone();
      url.pathname = `/showroom/${username}`;
      const response = NextResponse.rewrite(url);
      response.headers.set('x-pathname', pathname);
      return response;
    }
  }

  // 요청 헤더에 현재 경로 추가 (layout에서 사용)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    // 정적 파일 및 API 제외
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
