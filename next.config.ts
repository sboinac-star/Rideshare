import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.stripe.com",
      },
    ],
  },
  headers: async () => [
    {
      // Security headers for all routes
      source: "/:path*",
      headers: [
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
    {
      // API routes headers
      source: "/api/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "no-store",
        },
        {
          key: "X-RateLimit-Limit",
          value: "100",
        },
        {
          key: "X-RateLimit-Window",
          value: "900", // 15 minutes in seconds
        },
      ],
    },
  ],
  // Additional security settings
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
};

export default nextConfig;
