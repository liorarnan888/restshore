import type { Metadata } from "next";

import { appBaseUrl, brandName } from "@/lib/brand";

export const editorialAuthor = "RestShore editorial team";

function normalizePath(path: string) {
  if (!path || path === "/") {
    return "";
  }

  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path = "/") {
  return `${appBaseUrl()}${normalizePath(path)}`;
}

export function buildPageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const url = absoluteUrl(path);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots: index
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title,
      description,
      url,
      siteName: brandName,
      images: [
        {
          url: absoluteUrl("/restshore/og-image.png"),
          width: 1536,
          height: 1024,
          alt: `${brandName} launch illustration`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [absoluteUrl("/restshore/og-image.png")],
    },
  };
}

export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brandName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/restshore/logo-badge.svg"),
  };
}

export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: brandName,
    url: absoluteUrl("/"),
  };
}

export function buildArticleJsonLd({
  title,
  description,
  path,
  dateModified,
  keywords,
}: {
  title: string;
  description: string;
  path: string;
  dateModified: string;
  keywords?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    dateModified,
    author: {
      "@type": "Organization",
      name: editorialAuthor,
    },
    publisher: {
      "@type": "Organization",
      name: brandName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/restshore/logo-badge.svg"),
      },
    },
    mainEntityOfPage: absoluteUrl(path),
    keywords,
  };
}

export function buildBreadcrumbJsonLd(
  items: Array<{
    name: string;
    path: string;
  }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
