import type { MetadataRoute } from "next";

import { appBaseUrl } from "@/lib/brand";

const routes = [
  "",
  "/privacy",
  "/terms",
  "/support",
  "/what-is-cbti",
  "/sleep-diary",
  "/trouble-falling-asleep",
  "/wake-time-problems",
  "/insomnia-support",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appBaseUrl();
  const lastModified = new Date("2026-03-20T00:00:00.000Z");

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.72,
  }));
}
