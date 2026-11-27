import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  outputFileTracingExcludes: {
    "*": [
      "./public/data/**/*",
      "public/data/**/*",
      "./public/pagefind/**/*",
      "public/pagefind/**/*",
      "./public/api/**/*",
      "public/api/**/*",
      "./public/j/**/*",
      "public/j/**/*",
    ],
  },
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
  async redirects() {
    return [
      {
        source: "/structure",
        destination: "/about#how-this-is-built",
        permanent: true,
      },
      {
        source: "/j/:id/structure",
        destination: "/about#how-this-is-built",
        permanent: true,
      },
      {
        source: "/j/:id/review",
        destination: "/j/:id",
        permanent: true,
      },
      {
        source: "/j/:id/clauses",
        destination: "/j/:id/sources",
        permanent: true,
      },
      {
        source: "/j/:id/documents",
        destination: "/j/:id/sources",
        permanent: true,
      },
      {
        source: "/j/:id/documents/:doc/:eid",
        destination: "/j/:id/documents/:doc#node-:eid",
        permanent: true,
      },
      {
        source: "/j/:id/topics/land_use",
        destination: "/j/:id/topics/land-use",
        permanent: true,
      },
      {
        source: "/j/:id/topics/ground_coverage",
        destination: "/j/:id/topics/ground-coverage",
        permanent: true,
      },
      {
        source: "/j/:id/topics/building_height",
        destination: "/j/:id/topics/height",
        permanent: true,
      },
      {
        source: "/j/:id/topics/basements_stilts",
        destination: "/j/:id/topics/basements-and-stilts",
        permanent: true,
      },
      {
        source: "/j/:id/topics/projections_open_spaces",
        destination: "/j/:id/topics/projections-and-open-spaces",
        permanent: true,
      },
      {
        source: "/j/:id/topics/approvals_certificates",
        destination: "/j/:id/topics/approvals-and-certificates",
        permanent: true,
      },
      {
        source: "/j/:id/topics/fire_safety",
        destination: "/j/:id/topics/fire-safety",
        permanent: true,
      },
      {
        source: "/j/:id/topics/plot_size_frontage",
        destination: "/j/:id/topics/plot-size-and-frontage",
        permanent: true,
      },
      {
        source: "/j/:id/topics/road_width",
        destination: "/j/:id/topics/road-width",
        permanent: true,
      },
      {
        source: "/j/:id/topics/deviations_regularisation",
        destination: "/j/:id/topics/deviations-and-compounding",
        permanent: true,
      },
      {
        source: "/report-problem",
        destination:
          "https://github.com/manideepmamidala2-bit/bylaws-india/issues/new?template=report-problem-with-a-rule.yml",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    const mdAfterFiles = [
      {
        source: "/j/:id/documents/:doc/:eid.md",
        destination: "/api/markdown?kind=provision&id=:id&doc=:doc&eid=:eid",
      },
      {
        source: "/j/:id/documents/:doc.md",
        destination: "/api/markdown?kind=document&id=:id&doc=:doc",
      },
      {
        source: "/j/:id/topics/:topic.md",
        destination: "/api/markdown?kind=topic&id=:id&topic=:topic",
      },
    ];
    if (process.env.VERCEL === "1") {
      return {
        beforeFiles: [
          {
            source: "/data/:jur/basemap.pmtiles",
            destination: "/data/in-ka-bengaluru-south/basemap.pmtiles",
          },
        ],
        afterFiles: mdAfterFiles,
        fallback: [],
      };
    }
    return {
      beforeFiles: [
        {
          source: "/data/:path*.pmtiles",
          destination: "/api/range/data/:path*.pmtiles",
        },
      ],
      afterFiles: mdAfterFiles,
      fallback: [],
    };
  },
};

export default nextConfig;
