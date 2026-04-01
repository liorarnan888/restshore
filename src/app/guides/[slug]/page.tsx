import { notFound } from "next/navigation";

import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { guideLibrary, guideSlugs } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export function generateStaticParams() {
  return guideSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guideLibrary[slug];

  if (!guide) {
    return {};
  }

  return buildPageMetadata({
    title: `${guide.title} | RestShore`,
    description: guide.description,
    path: guide.path,
  });
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = guideLibrary[slug];

  if (!guide) {
    notFound();
  }

  return <GuideArticlePage guide={guide} />;
}
