import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { wakeTimeProblemsGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${wakeTimeProblemsGuide.title} | RestShore`,
  description: wakeTimeProblemsGuide.description,
  path: wakeTimeProblemsGuide.path,
});

export default function WakeTimeProblemsPage() {
  return <GuideArticlePage guide={wakeTimeProblemsGuide} />;
}
