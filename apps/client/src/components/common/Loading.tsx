"use client";

import Lottie from "lottie-react";
import { useEffect, useState } from "react";

const Loading = () => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch("/assets/animations/loading.json")
      .then((response) => response.json())
      .then((data) => setAnimationData(data));
  }, []);

  if (!animationData) return null;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <Lottie animationData={animationData} loop style={{ width: 200, height: 200 }} />
    </div>
  );
};

export default Loading;
