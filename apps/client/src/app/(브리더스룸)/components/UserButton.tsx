"use client";

import Link from "next/link";
import { useUserStore } from "../store/user";
import { UserCircle } from "lucide-react";

const UserButton = () => {
  const { user } = useUserStore();

  return (
    <Link
      className="flex items-center gap-3 bg-sky-50 p-2 pl-2 font-bold text-gray-900 hover:bg-sky-100 hover:font-bold hover:text-blue-900"
      href={user ? "/settings" : "/sign-in"}
    >
      <UserCircle className="size-6" />
      <div className="flex flex-col">
        {user ? user.name : "로그인"}
        <span className="text-xs font-normal text-gray-500">{user ? user.email : ""}</span>
      </div>
    </Link>
  );
};

export default UserButton;
