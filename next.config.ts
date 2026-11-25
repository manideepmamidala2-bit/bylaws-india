import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/data/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, HEAD, OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value: "Range, If-None-Match, Content-Type",
          },
          {
            key: "Access-Control-Expose-Headers",
            value: "Content-Range, Content-Length, Accept-Ranges, ETag",
          },
          { key: "Accept-Ranges", value: "bytes" },
        ],
      },
    ];
  },
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/data/:path*.pmtiles",
          destination: "/api/range/data/:path*.pmtiles",
        },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;
