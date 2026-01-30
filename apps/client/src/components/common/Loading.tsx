"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/../public/assets/animations/loading.json";
import successAnimation from "@/../public/assets/animations/success.json";
import failAnimation from "@/../public/assets/animations/fail.json";

type AnimationType = "loading" | "success" | "fail";

const animationMap = {
  loading: loadingAnimation,
  success: successAnimation,
  fail: failAnimation,
} as const;

interface LoadingProps {
  type?: AnimationType;
  loop?: boolean;
  size?: number;
}

const Loading = ({ type = "loading", loop, size = 200 }: LoadingProps) => {
  const animationData = animationMap[type];
  const shouldLoop = loop ?? type === "loading";

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Lottie animationData={animationData} loop={shouldLoop} style={{ width: size, height: size }} />
    </div>
  );
};

export default Loading;
