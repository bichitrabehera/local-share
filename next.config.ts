import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Phones on the LAN load the dev server by IP, not localhost. Without this,
  // Next blocks dev-only assets/HMR for those origins.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  experimental: {
    agentFeedback: true,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
