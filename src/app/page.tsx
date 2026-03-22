import Image from "next/image";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/brand-logo";
import { BetaFeedbackCard } from "@/components/launch/beta-feedback-card";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import { IntakeExperience } from "@/components/intake/intake-experience";
import {
  appSupportPromise,
  betaFeedbackMessage,
  betaLabel,
  brandDescription,
  brandName,
  brandTagline,
  supportEmail,
  supportMailto,
} from "@/lib/brand";

export const dynamic = "force-dynamic";

const launchHighlights = [
  "Free public beta",
  "6-week plan",
  "Optional Google calendar",
  "Doctor-ready report",
];

export default function Home() {
  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <LaunchPageView route="/" metadata={{ surface: "homepage" }} />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-3 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo
              variant="mark"
              className="h-10 w-10 shrink-0 md:hidden"
              priority
            />
            <BrandLogo
              variant="lockup"
              className="hidden h-11 w-auto shrink-0 md:block"
              priority
            />
            <div className="md:hidden">
              <p className="display text-lg text-[color:var(--foreground)]">
                {brandName}
              </p>
              <p className="text-xs">{brandTagline}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 md:block">
              {betaLabel} | no billing | early access
            </div>
            {process.env.NODE_ENV !== "production" ? (
              <>
                <Link
                  href="/launch-insights"
                  className="hidden rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 font-medium text-[color:var(--foreground)] lg:block"
                >
                  Launch Insights
                </Link>
                <Link
                  href="/test-center"
                  className="hidden rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 font-medium text-[color:var(--foreground)] lg:block"
                >
                  Open Test Center
                </Link>
              </>
            ) : null}
          </div>
        </header>

        <section className="relative overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(145deg,rgba(255,249,240,0.96),rgba(255,255,255,0.72))] p-4 shadow-[0_18px_48px_rgba(31,35,64,0.08)] sm:p-5">
          <div className="grain absolute inset-0 rounded-[34px]" />
          <div className="pointer-events-none absolute -right-24 top-12 h-44 w-44 rounded-full bg-[rgba(45,141,143,.08)] blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-6 h-40 w-40 rounded-full bg-[rgba(245,127,91,.10)] blur-3xl" />

          <div className="relative grid gap-5 lg:grid-cols-[1.02fr_0.98fr] lg:items-end">
            <div className="space-y-3">
              <span className="inline-flex rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
                {betaLabel}
              </span>
              <h1 className="display max-w-3xl text-2xl font-semibold leading-[1.06] text-[color:var(--foreground)] sm:text-3xl lg:text-[2.7rem]">
                CBT-I informed sleep coaching for calmer nights, clearer mornings, and a plan you
                can actually follow.
              </h1>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                {brandDescription}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--foreground)]">
                {betaFeedbackMessage}
              </p>
              <p className="max-w-2xl text-sm leading-7 text-[color:var(--muted)]">
                Google is optional and only appears after the intake if you want a dedicated
                RestShore calendar in your own Google account.
              </p>
            </div>

            <div className="grid gap-3 lg:justify-items-end">
              <div className="relative w-full max-w-[500px] overflow-hidden rounded-[32px] border border-white/80 bg-white/70 p-2 shadow-[0_18px_40px_rgba(31,35,64,0.08)]">
                <Image
                  src="/restshore/hero-illustration.png"
                  alt="Abstract RestShore hero illustration with layered night-to-morning shapes"
                  width={1536}
                  height={1024}
                  className="h-auto w-full rounded-[26px] object-cover"
                  priority
                />
                <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-[24px] border border-white/70 bg-[rgba(255,250,244,0.84)] p-4 backdrop-blur">
                  <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                    {brandName} launch visual
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                    A dawn-facing illustration system for a calmer six-week story, with breathing room for trust and clarity.
                  </p>
                </div>
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-2 lg:max-w-[500px]">
                {launchHighlights.map((item) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/80 bg-white/78 px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(31,35,64,0.06)]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-2">
          <IntakeExperience />
        </section>

        <section className="grid gap-4 pb-8 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
              Before you start
            </p>
            <h2 className="display mt-3 text-3xl text-[color:var(--foreground)]">
              What this beta is
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-[color:var(--muted)]">
              <p>
                {brandName} turns a guided intake into a six-week rhythm, a doctor-ready sleep
                report, and an optional calendar structure you can actually follow.
              </p>
              <p>
                There is no billing in this version and no paid acquisition behind it. We are
                starting with people who are comfortable trying a thoughtful early product and
                telling us what holds up.
              </p>
              <p>
                If you choose Google Calendar at the end, RestShore asks only for the access
                needed to create and manage the dedicated RestShore calendar it adds for you.
                It does not take over your main calendar.
              </p>
              <p>{appSupportPromise}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/privacy"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                Terms
              </Link>
              <Link
                href="/support"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                Support
              </Link>
            </div>
          </article>

          <BetaFeedbackCard
            source="homepage"
            title={`Help shape ${brandName}`}
            description="If you have been through the product or even just the homepage, tell us what feels promising or confusing. We are using early notes to tighten the first public beta."
          />
        </section>

        <section className="grid gap-4 pb-2 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
              Google and trust
            </p>
            <h2 className="display mt-3 text-3xl text-[color:var(--foreground)]">
              What Google access is for
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-[color:var(--muted)]">
              <p>
                RestShore uses Google sign-in only after the intake, and only if you choose to
                add your plan to Google Calendar.
              </p>
              <p>
                The product creates and manages a dedicated RestShore calendar in your account so
                your sleep plan stays separate from your main calendar.
              </p>
              <p>
                You can remove that calendar and revoke Google access at any time.
              </p>
              <p>
                RestShore&apos;s use of information received from Google APIs adheres to the Google API
                Services User Data Policy, including the Limited Use requirements.
              </p>
            </div>
          </article>

          <article className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
              Help and contact
            </p>
            <h2 className="display mt-3 text-3xl text-[color:var(--foreground)]">
              Need support, account help, or data deletion?
            </h2>
            <div className="mt-4 grid gap-3 text-sm leading-6 text-[color:var(--muted)]">
              <p>
                Email{" "}
                <a
                  className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
                  href={supportMailto("RestShore support request")}
                >
                  {supportEmail}
                </a>{" "}
                or open the support page for Google access, calendar removal, and data deletion
                instructions.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/support"
                className="rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-4 py-2 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
              >
                Open support
              </Link>
              <a
                href={supportMailto("RestShore support request")}
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                Email support
              </a>
            </div>
          </article>
        </section>

        <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
            Explore more
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            {[
              { href: "/what-is-cbti", label: "What is CBT-I?" },
              { href: "/sleep-diary", label: "Why a sleep diary helps" },
              { href: "/trouble-falling-asleep", label: "Trouble falling asleep" },
              { href: "/wake-time-problems", label: "Why wake time matters" },
              { href: "/insomnia-support", label: "Insomnia support" },
              { href: "/support", label: "Support" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
