"use client";

import { tokenStorage } from "@/lib/tokenStorage";
import Link from "next/link";

const UserButton = () => {
  // TODO: 매번 스토리지 조회 대신 유저 세션 관리 hook 적용하기
  const isLoggedIn = tokenStorage.getToken();

  return <Link href={isLoggedIn ? "/settings" : "/sign-in"}>{isLoggedIn ? "설정" : "로그인"}</Link>;
};

export default UserButton;
