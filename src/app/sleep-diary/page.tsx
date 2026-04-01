import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { sleepDiaryGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${sleepDiaryGuide.title} | RestShore`,
  description: sleepDiaryGuide.description,
  path: sleepDiaryGuide.path,
});

export default function SleepDiaryPage() {
  return <GuideArticlePage guide={sleepDiaryGuide} />;
}
