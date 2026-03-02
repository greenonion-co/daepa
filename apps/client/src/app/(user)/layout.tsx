import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL;

async function isRefreshTokenValid(refreshToken: string): Promise<boolean> {
  try {
    if (!BASE_URL) return false;
    const res = await fetch(`${BASE_URL}/api/auth/token`, {
      headers: { Cookie: `refreshToken=${refreshToken}` },
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken");

  // refreshToken이 존재하고 유효한 경우에만 홈으로 리다이렉트
  if (refreshToken?.value && (await isRefreshTokenValid(refreshToken.value))) {
    redirect("/");
  }

  return <>{children}</>;
}
