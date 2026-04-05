import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { BizGuard } from "./components/BizGuard";

// 비로그인 사용자도 접근 가능한 경로 패턴
const PUBLIC_PATHS = [
  /^\/pet\/(?!deleted$)[^/]+$/, // /pet/[petId] (펫 상세 페이지, /pet/deleted 제외)
  /^\/pet\/(?!deleted$)[^/]+\/relation$/, // /pet/[petId]/relation (가계도 페이지)
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
  const refreshToken = cookieStore.get("refreshToken");
  // 현재 경로 확인
  const pathname = headersList.get("x-pathname") || "";

  // 공개 경로도 비공개 경로도 모두 BizGuard로 감싸서
  // 클라이언트 네비게이션 시에도 가드가 동작하도록 함
  const isPublic = isPublicPath(pathname);

  // 비공개 경로는 refreshToken 존재 여부로 인증 체크
  if (!isPublic && !refreshToken?.value) {
    redirect("/sign-in");
  }

  return <BizGuard>{children}</BizGuard>;
}
