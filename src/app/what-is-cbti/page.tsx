import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { whatIsCbtiGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${whatIsCbtiGuide.title} | RestShore`,
  description: whatIsCbtiGuide.description,
  path: whatIsCbtiGuide.path,
});

export default function WhatIsCbtiPage() {
  return <GuideArticlePage guide={whatIsCbtiGuide} />;
}
