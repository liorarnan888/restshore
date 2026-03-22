import type { MetadataRoute } from "next";

import { appBaseUrl } from "@/lib/brand";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = appBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/report/", "/check-in/", "/launch-insights", "/test-center"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
