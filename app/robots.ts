import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  const siteCfg = getSiteConfig();
  const baseUrl = siteCfg.siteUrl.replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
