import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BizGuard } from "./components/BizGuard";

// 비로그인 사용자도 접근 가능한 경로 패턴
const PUBLIC_PATHS = [
  /^\/pet\/[^/]+$/, // /pet/[petId] (펫 상세 페이지)
];

// isBiz 체크를 하지 않는 경로 패턴 (비사업자도 접근 가능)
const BIZ_EXEMPT_PATHS = [
  /^\/settings(\/|$)/, // /settings, /settings/*
  /^\/pet\/[^/]+$/, // /pet/[petId] (펫 상세 페이지)
];

function isPublicPath(pathname: string): boolean {
  const normalizedPathname = pathname.replace(/\/$/, ""); // 트레일링 슬래시 제거
  return PUBLIC_PATHS.some((pattern) => pattern.test(normalizedPathname));
}

function isBizExemptPath(pathname: string): boolean {
  const normalizedPathname = pathname.replace(/\/$/, "");
  return BIZ_EXEMPT_PATHS.some((pattern) => pattern.test(normalizedPathname));
}

export default async function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const refreshToken = cookieStore.get("refreshToken");
  // 현재 경로 확인
  const pathname = headersList.get("x-pathname") || "";

  // 공개 경로는 인증 체크 스킵
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  // 비공개 경로는 refreshToken 존재 여부로 인증 체크
  if (!refreshToken?.value) {
    redirect("/sign-in");
  }

  // isBiz 면제 경로는 가드 없이 렌더링
  if (isBizExemptPath(pathname)) {
    return <>{children}</>;
  }

  // 나머지 경로는 isBiz 가드 적용
  return <BizGuard>{children}</BizGuard>;
}
