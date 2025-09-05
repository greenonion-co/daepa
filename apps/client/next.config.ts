import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false, // Strict Mode 비활성화
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "daepa.store",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.daepa.store",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
