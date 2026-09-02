import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all local network IPs and tunnels to access dev server without 403
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "192.168.1.8",
    "192.168.*.*",
    "10.*.*.*",
    "*.trycloudflare.com",
    "*.loca.lt",
    "*.ngrok.io",
    "*.ngrok-free.app",
  ],
};

export default nextConfig;
