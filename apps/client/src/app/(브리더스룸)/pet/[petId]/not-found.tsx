"use client";

import Lottie from "lottie-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NotFound() {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/assets/animations/not-found.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-4">
      <div className="w-full max-w-[500px]">
        <Lottie animationData={animationData} loop={true} />
      </div>
      <h2 className="text-2xl font-bold">존재하지 않는 개체입니다</h2>
      <Link
        href="/pet"
        className="rounded-lg bg-[#1A56B3] px-4 py-2 text-white hover:bg-[#1A56B3]/90"
      >
        목록으로 돌아가기
      </Link>
    </div>
  );
}
