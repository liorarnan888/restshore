import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { howRestShoreWorksGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${howRestShoreWorksGuide.title} | RestShore`,
  description: howRestShoreWorksGuide.description,
  path: howRestShoreWorksGuide.path,
});

export default function HowRestShoreWorksPage() {
  return <GuideArticlePage guide={howRestShoreWorksGuide} />;
}
