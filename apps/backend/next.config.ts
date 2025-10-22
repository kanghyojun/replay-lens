import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sc2ts와 그 의존성들을 external로 설정
  // Turbopack + pnpm 이슈로 child dependencies를 직접 설치해야 함
  // 참고: https://github.com/vercel/next.js/issues/68805
  serverExternalPackages: ["sc2ts", "compressjs", "seek-bzip", "fflate"],
};

export default nextConfig;
