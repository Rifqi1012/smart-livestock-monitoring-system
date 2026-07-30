import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server to be reached from the LAN IP and cloudflare tunnels
  // (Next 16 blocks cross-origin dev resources by default).
  allowedDevOrigins: ["192.168.0.199", "*.trycloudflare.com"],
};

export default nextConfig;
