import type { Metadata } from "next";

import { BrandLogo } from "@/components/brand/brand-logo";
import { DailyCheckInExperience } from "@/components/checkin/daily-checkin-experience";
import { getDailyCheckIn } from "@/lib/session-service";
import { brandName } from "@/lib/brand";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: `${brandName} check-in`,
  description: "Private daily sleep log for an existing RestShore plan.",
  path: "/check-in",
  index: false,
});

export default async function DailyCheckInPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string; nightDate: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { sessionId, nightDate } = await params;
  const { token } = await searchParams;
  let initialDraftDefaults = null;
  let initialError: string | null = null;

  if (token) {
    try {
      initialDraftDefaults = (await getDailyCheckIn(sessionId, nightDate, token)).draftDefaults;
    } catch (error) {
      initialError =
        error instanceof Error ? error.message : "We couldn't load this sleep check-in.";
    }
  } else {
    initialError = "This check-in link is missing its validation token.";
  }

  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
      <LaunchPageView
        route={`/check-in/${sessionId}/${nightDate}`}
        sessionId={sessionId}
        metadata={{ surface: "daily_checkin" }}
      />
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-3 sm:gap-4">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-2 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-8 w-8 shrink-0" priority />
            <div>
              <p className="display text-base text-[color:var(--foreground)] sm:text-lg">
                {brandName}
              </p>
            </div>
          </div>
        </header>

        <DailyCheckInExperience
          sessionId={sessionId}
          nightDate={nightDate}
          token={token ?? ""}
          initialDraftDefaults={initialDraftDefaults}
          initialError={initialError}
        />
      </div>
    </main>
  );
}
