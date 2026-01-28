import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");

  // 이미 로그인된 사용자는 홈으로 리다이렉트
  if (token?.value) {
    redirect("/");
  }

  return <>{children}</>;
}
