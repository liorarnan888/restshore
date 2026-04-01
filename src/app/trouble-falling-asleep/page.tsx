import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { troubleFallingAsleepGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${troubleFallingAsleepGuide.title} | RestShore`,
  description: troubleFallingAsleepGuide.description,
  path: troubleFallingAsleepGuide.path,
});

export default function TroubleFallingAsleepPage() {
  return <GuideArticlePage guide={troubleFallingAsleepGuide} />;
}
