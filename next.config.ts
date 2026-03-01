import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // next lint is incompatible with the current flat config (ESLint 9 format)
    // while ESLint 8 is installed. Run ESLint separately via `npx eslint .`
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
