import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // next lint is incompatible with the current flat config (ESLint 9 format)
    // while ESLint 8 is installed. Run ESLint separately via `npx eslint .`
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        // Legacy anonymous-escrow URL — page was deleted in 0.8.1. Without this
        // rule the Pages Router catch-all /listener/[uid] would match with uid
        // "arrange-meeting" and render "Listener not found" at HTTP 200.
        source: "/listener/arrange-meeting",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
