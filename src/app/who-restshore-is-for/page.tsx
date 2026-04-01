import { GuideArticlePage } from "@/components/launch/guide-article-page";
import { whoRestShoreIsForGuide } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: `${whoRestShoreIsForGuide.title} | RestShore`,
  description: whoRestShoreIsForGuide.description,
  path: whoRestShoreIsForGuide.path,
});

export default function WhoRestShoreIsForPage() {
  return <GuideArticlePage guide={whoRestShoreIsForGuide} />;
}
