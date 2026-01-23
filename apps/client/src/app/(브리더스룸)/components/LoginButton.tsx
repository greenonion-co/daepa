"use client";

import Link from "next/link";

const LoginButton = () => {
  return (
    <Link
      className="flex h-[32px] items-center rounded-lg px-2 text-[14px] font-medium text-blue-500 hover:font-bold dark:bg-black/80 dark:text-white dark:hover:font-bold"
      href="/sign-in"
    >
      아직&nbsp;<b>브리디</b>의 회원이 아니신가요?
    </Link>
  );
};

export default LoginButton;
