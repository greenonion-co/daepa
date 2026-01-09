import { cookies } from "next/headers";
import { ReactNode } from "react";

interface PetDetailLayoutProps {
  auth: ReactNode;
  public: ReactNode;
}

// 로그인 여부 확인
async function isLoggedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  return !!accessToken;
}

export default async function PetDetailLayout({ auth, public: publicSlot }: PetDetailLayoutProps) {
  const loggedIn = await isLoggedIn();

  return <>{loggedIn ? auth : publicSlot}</>;
}
