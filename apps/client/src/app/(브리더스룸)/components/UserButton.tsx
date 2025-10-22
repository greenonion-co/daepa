"use client";

import Link from "next/link";
import { useUserStore } from "../store/user";
import { Settings } from "lucide-react";

const UserButton = () => {
  const { user } = useUserStore();

  return (
    <Link
      className="flex h-[32px] items-center rounded-lg bg-blue-600 px-2 text-[14px] font-bold text-gray-100 hover:font-bold dark:bg-black/80 dark:text-white dark:hover:font-bold"
      href={user ? "/settings" : "/sign-in"}
    >
      <div className="flex flex-col">{user ? <Settings className="size-4" /> : "로그인"}</div>
    </Link>
  );
};

export default UserButton;
