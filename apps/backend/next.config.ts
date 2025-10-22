import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sc2ts", "compressjs", "seek-bzip", "fflate"],
};

export default nextConfig;
