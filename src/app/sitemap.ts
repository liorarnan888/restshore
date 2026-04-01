import type { MetadataRoute } from "next";

import { guideLibrary } from "@/lib/guide-content";
import { appBaseUrl } from "@/lib/brand";

const routes = [
  "",
  "/guides",
  "/how-restshore-works",
  "/who-restshore-is-for",
  "/what-is-cbti",
  "/sleep-diary",
  "/trouble-falling-asleep",
  "/wake-time-problems",
  "/insomnia-support",
  ...Object.values(guideLibrary).map((guide) => guide.path),
];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = appBaseUrl();
  const lastModified = new Date("2026-04-01T00:00:00.000Z");

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.72,
  }));
}
