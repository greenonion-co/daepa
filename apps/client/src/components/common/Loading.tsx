"use client";

import Lottie from "lottie-react";
import loadingAnimation from "@/../public/assets/animations/loading.json";

const Loading = () => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Lottie animationData={loadingAnimation} loop style={{ width: 200, height: 200 }} />
    </div>
  );
};

export default Loading;
