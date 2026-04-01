import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { insomniaSupportGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${insomniaSupportGuide.title} | RestShore`,
  description: insomniaSupportGuide.description,
  path: insomniaSupportGuide.path,
});

export default function InsomniaSupportPage() {
  return <GuideArticlePage guide={insomniaSupportGuide} />;
}
