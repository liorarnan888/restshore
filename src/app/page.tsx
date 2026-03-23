import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { ContinueWithGoogleButton } from "@/components/launch/continue-with-google-button";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import { appSupportPromise, betaLabel, brandName } from "@/lib/brand";
import { isGoogleAuthConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

const steps = [
  {
    number: "01",
    title: "Tell us what sleep has looked like",
    detail: "A short questionnaire that stays focused and personal.",
  },
  {
    number: "02",
    title: "Get your plan and summary",
    detail: "A personal sleep structure built from your answers, not generic advice.",
  },
  {
    number: "03",
    title: "Put the structure on your calendar",
    detail: "Google only appears at the end, if you want the plan to live there.",
  },
];

export default function Home() {
  const googleEnabled = isGoogleAuthConfigured();

  return (
    <main className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8">
      <LaunchPageView route="/" metadata={{ surface: "homepage", version: "refined_v3" }} />
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-[rgba(246,198,103,.14)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[rgba(45,141,143,.1)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-[rgba(255,255,255,.24)] blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10">
        <header className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-11 w-11 shrink-0 md:hidden" priority />
            <BrandLogo variant="lockup" className="hidden h-11 w-auto shrink-0 md:block" priority />
            <div className="md:hidden">
              <p className="display text-lg text-[color:var(--foreground)]">{brandName}</p>
            </div>
          </div>

          {googleEnabled ? (
            <div className="flex flex-wrap items-center gap-1 text-sm text-[color:var(--muted)]">
              <span>Already have a plan?</span>
              <ContinueWithGoogleButton label="Continue with Google" variant="link" />
            </div>
          ) : null}
        </header>

        <section className="relative grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
              {betaLabel}
            </p>
            <h1 className="display mt-3 text-[2.2rem] leading-[0.98] text-[color:var(--foreground)] sm:text-[3.15rem]">
              <span className="block">CBT-I, made practical.</span>
              <span className="block">A personal sleep plan you can actually follow.</span>
            </h1>
            <p className="mt-4 text-[0.98rem] leading-7 text-[color:var(--muted)] sm:text-base sm:leading-7">
              CBT-I is a well-studied behavioral framework for improving sleep habits and routines. The hard part is access: time, cost, scheduling, and the work of turning guidance into real life.
            </p>
            <p className="mt-3 text-[0.98rem] leading-7 text-[color:var(--foreground)] sm:text-base sm:leading-7">
              {brandName} is built around CBT-I-inspired structure and turns it into a personal plan, a clear summary, and an optional calendar you can actually use.
            </p>

            <div className="mt-6 flex flex-col items-start gap-3">
              <Link
                href="/start"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-6 py-3.5 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5 sm:w-auto"
              >
                Start the questionnaire
                <ArrowRight className="h-4 w-4" />
              </Link>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                You&apos;ll leave with a personal sleep summary, a 6-week starting plan, and an optional calendar version. No Google required to start.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-[rgba(255,255,255,0.72)] p-2 shadow-[0_20px_44px_rgba(31,35,64,0.08)]">
            <Image
              src="/restshore/hero-illustration.png"
              alt="RestShore illustration with calm night-to-morning forms"
              width={1536}
              height={1024}
              className="h-auto w-full rounded-[24px] object-cover"
              priority
            />
            <div className="absolute bottom-4 left-4 right-4 max-w-[340px] rounded-[22px] border border-white/75 bg-[rgba(255,248,239,0.92)] px-4 py-4 backdrop-blur">
              <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                What you get
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                Not another pile of sleep advice. A personal plan, a clear summary, and an optional calendar built from your answers.
              </p>
            </div>
          </div>
        </section>

        <section className="max-w-3xl rounded-[8px] border-l-2 border-[rgba(31,35,64,.12)] pl-5">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
            Why this exists
          </p>
          <h2 className="display mt-3 text-3xl leading-[1.04] text-[color:var(--foreground)]">
            The method is not the problem. Getting it into real life is.
          </h2>
          <div className="mt-5 grid gap-4 text-base leading-7 text-[color:var(--muted)]">
            <p>
              People do not just need to hear that sleep needs structure. They need a structure that fits their own pattern, arrives in a usable form, and is easier to follow when the night gets hard.
            </p>
            <p>
              That is the job of RestShore: take what usually gets spread across appointments, notes, and recommendations, and turn it into something concrete, personal, and easier to carry into daily life.
            </p>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="max-w-xl">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
              How it works
            </p>
            <h2 className="display mt-3 text-[2.2rem] leading-[1.02] text-[color:var(--foreground)]">
              A short path from answers to structure.
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step) => (
              <article
                key={step.number}
                className="rounded-[26px] border border-[rgba(31,35,64,.10)] bg-[rgba(255,255,255,.68)] px-5 py-5 shadow-[0_14px_30px_rgba(31,35,64,0.05)]"
              >
                <p className="text-sm font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
                  {step.number}
                </p>
                <h3 className="mt-4 text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {step.detail}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-[28px] border border-white/80 bg-[rgba(255,250,244,0.75)] px-5 py-5 shadow-[0_16px_34px_rgba(31,35,64,0.06)] sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
                Google and trust
              </p>
              <p className="mt-3 text-base leading-7 text-[color:var(--foreground)]">
                New users start with the questionnaire. Google only appears at the end, if you want the calendar. If you already have a plan, you can continue with Google and get back to it.
              </p>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                {appSupportPromise}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Public-facing content is educational and behavioral in nature. It is not medical care, diagnosis, or emergency support.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-[color:var(--muted)]">
              <Link href="/privacy" className="transition hover:text-[color:var(--foreground)]">
                Privacy
              </Link>
              <Link href="/terms" className="transition hover:text-[color:var(--foreground)]">
                Terms
              </Link>
              <Link href="/support" className="transition hover:text-[color:var(--foreground)]">
                Support
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
