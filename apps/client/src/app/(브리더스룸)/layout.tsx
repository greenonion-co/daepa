import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

// 비로그인 사용자도 접근 가능한 경로 패턴
const PUBLIC_PATHS = [
  /^\/pet\/[^/]+$/, // /pet/[petId] (펫 상세 페이지)
];

function isPublicPath(pathname: string): boolean {
  const normalizedPathname = pathname.replace(/\/$/, ""); // 트레일링 슬래시 제거
  return PUBLIC_PATHS.some((pattern) => pattern.test(normalizedPathname));
}

export default async function BrLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [cookieStore, headersList] = await Promise.all([cookies(), headers()]);
  const token = cookieStore.get("accessToken");

  // 현재 경로 확인
  const pathname = headersList.get("x-pathname") || "";

  // 공개 경로는 인증 체크 스킵
  if (!token?.value && !isPublicPath(pathname)) {
    redirect("/sign-in");
  }

  return <>{children}</>;
}
