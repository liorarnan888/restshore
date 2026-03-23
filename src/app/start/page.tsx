import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { IntakeExperience } from "@/components/intake/intake-experience";
import { LaunchPageView } from "@/components/launch/launch-page-view";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Sleep Questionnaire | RestShore",
  robots: {
    index: false,
    follow: false,
  },
};

export default function StartPage() {
  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <LaunchPageView route="/start" metadata={{ surface: "intake_entry" }} />
      <div className="pointer-events-none absolute -left-12 top-16 h-44 w-44 rounded-full bg-[rgba(246,198,103,.14)] blur-3xl" />
      <div className="pointer-events-none absolute -right-10 top-48 h-56 w-56 rounded-full bg-[rgba(45,141,143,.1)] blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-2">
        <header className="rounded-[24px] border border-white/75 bg-[rgba(255,255,255,0.74)] px-4 py-3 shadow-[0_12px_26px_rgba(31,35,64,0.05)]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo variant="mark" className="h-10 w-10 shrink-0" priority />
              <div>
                <p className="display text-xl text-[color:var(--foreground)]">RestShore</p>
              </div>
            </div>

            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-[color:var(--muted)] underline decoration-[rgba(31,35,64,.2)] decoration-1 underline-offset-4 transition hover:text-[color:var(--foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back home
            </Link>
          </div>
        </header>

        <section className="pb-6">
          <IntakeExperience route="/start" />
        </section>
      </div>
    </main>
  );
}
