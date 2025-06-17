"use client";

import Link from "next/link";

const UserButton = () => {
  const isLoggedIn = localStorage.getItem("accessToken");

  const handleClick = () => {
    if (isLoggedIn) {
      localStorage.removeItem("accessToken");
    }
  };

  return (
    <Link href={isLoggedIn ? "/sign-in" : "/sign-in"} onClick={handleClick}>
      {isLoggedIn ? "로그아웃" : "로그인"}
    </Link>
  );
};

export default UserButton;
