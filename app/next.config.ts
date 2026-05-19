import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
  experimental: {
    // 认证 fetch 不走 Cache Components
    // (在 Next.js 16 这是 cacheComponents: false；15.x 默认即为 false)
  },
};

export default nextConfig;
