import Link from "next/link";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { format } from "date-fns";

import { BrandLogo } from "@/components/brand/brand-logo";
import { AdaptationPreviewCard } from "@/components/report/adaptation-preview-card";
import { StructuralReviewPreviewCard } from "@/components/report/structural-review-preview-card";
import { brandName } from "@/lib/brand";
import { listSessions } from "@/lib/session-repository";
import { getSession } from "@/lib/session-service";
import {
  isTestCenterAuthConfigured,
  TEST_CENTER_ACCESS_COOKIE_NAME,
  verifyTestCenterAccessToken,
} from "@/lib/test-center-access";
import { buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: `${brandName} Test Center`,
  description: "Internal QA surface for RestShore.",
  path: "/test-center",
  index: false,
});

function formatTimestamp(value?: string) {
  if (!value) {
    return "Not yet";
  }

  return format(new Date(value), "MMM d, yyyy - h:mm a");
}

function findNextCheckInLink(
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>,
) {
  if (!session.generatedPlan) {
    return null;
  }

  const loggedNightDates = new Set(
    (session.dailyCheckIns ?? []).map((entry) => entry.nightDate),
  );

  return (
    session.generatedPlan.events.find(
      (event) =>
        event.eventRole === "daily_checkin" &&
        event.actionUrl &&
        event.nightDate &&
        !loggedNightDates.has(event.nightDate),
    ) ?? null
  );
}

function accessErrorMessage(error?: string) {
  switch (error) {
    case "invalid":
      return "That password did not work. Please try again.";
    case "unavailable":
      return "Test Center access is not configured on this deployment yet.";
    default:
      return null;
  }
}

function TestCenterAccessGate({
  redirectTo,
  error,
}: {
  redirectTo: string;
  error?: string;
}) {
  const message = accessErrorMessage(error);
  const configured = isTestCenterAuthConfigured();

  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-4">
        <header className="flex items-center gap-3 rounded-full border border-white/60 bg-white/55 px-4 py-3 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <BrandLogo variant="mark" className="h-10 w-10 shrink-0" priority />
          <div>
            <p className="display text-lg text-[color:var(--foreground)]">
              {brandName} Test Center
            </p>
            <p className="text-xs">Production QA hub with password-only access</p>
          </div>
        </header>

        <section className="glass-panel rounded-[32px] border border-white/75 p-6 sm:p-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
            Internal access
          </p>
          <h1 className="display mt-3 text-4xl leading-tight text-[color:var(--foreground)]">
            Enter the Test Center password to continue.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[color:var(--muted)]">
            This production surface is reserved for QA, review, and scenario
            simulation. The public product stays on the normal user paths.
          </p>

          {message ? (
            <p className="mt-5 rounded-[20px] border border-[rgba(235,93,52,.2)] bg-[rgba(235,93,52,.08)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]">
              {message}
            </p>
          ) : null}

          {!configured ? (
            <p className="mt-5 rounded-[20px] border border-[color:var(--line)] bg-white/90 px-4 py-4 text-sm leading-6 text-[color:var(--muted)]">
              Set <code>TEST_CENTER_PASSWORD</code> and <code>AUTH_SECRET</code> on
              this deployment to unlock the production Test Center.
            </p>
          ) : (
            <form
              action="/api/test-center/login"
              method="post"
              className="mt-6 grid gap-4 sm:max-w-xl"
            >
              <input type="hidden" name="redirectTo" value={redirectTo} />
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  Password
                </span>
                <input
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter internal password"
                  className="rounded-[18px] border border-[color:var(--line)] bg-white/95 px-4 py-3 text-base text-[color:var(--foreground)] outline-none transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--accent)]"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
                >
                  Unlock Test Center
                </button>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                >
                  Back home
                </Link>
              </div>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                Once unlocked, the page will show sessions, daily diary previews,
                adaptation labs, and review tools in one place.
              </p>
            </form>
          )}
        </section>
      </div>
    </main>
  );
}

export default async function TestCenterPage({
  searchParams,
}: {
  searchParams: Promise<{ session?: string; error?: string }>;
}) {
  const { session: selectedSessionId, error } = await searchParams;
  const isProduction = process.env.NODE_ENV === "production";
  const cookieStore = isProduction ? await cookies() : null;
  const accessToken = cookieStore?.get(TEST_CENTER_ACCESS_COOKIE_NAME)?.value;
  const hasAccess = !isProduction || verifyTestCenterAccessToken(accessToken);

  if (!hasAccess) {
    const redirectTo = selectedSessionId
      ? `/test-center?session=${encodeURIComponent(selectedSessionId)}`
      : "/test-center";

    return <TestCenterAccessGate redirectTo={redirectTo} error={error} />;
  }

  const allSessions = (await listSessions()).sort((left, right) =>
    right.updatedAt.localeCompare(left.updatedAt),
  );
  const fallbackSessionId = allSessions[0]?.id;
  const activeSessionId = selectedSessionId ?? fallbackSessionId ?? null;
  const activeSession = activeSessionId ? await getSession(activeSessionId) : null;
  const nextCheckIn = activeSession ? findNextCheckInLink(activeSession) : null;
  const previewEventCount = activeSession?.generatedPlan?.events.length ?? 0;
  const dailyLogCount = activeSession?.dailyCheckIns?.length ?? 0;

  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-3 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <div className="flex items-center gap-3">
            <BrandLogo variant="mark" className="h-10 w-10 shrink-0" priority />
            <div>
              <p className="display text-lg text-[color:var(--foreground)]">
                {brandName} Test Center
              </p>
              <p className="text-xs">
                Production QA hub for sessions, diary, adaptation, and future flows
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[color:var(--line)] bg-white/70 px-4 py-2 md:block">
              Human-friendly testing, not raw ids and guesswork
            </div>
            {isProduction ? (
              <form action="/api/test-center/logout" method="post">
                <button
                  type="submit"
                  className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                >
                  Log out
                </button>
              </form>
            ) : null}
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h1 className="display text-4xl leading-tight text-[color:var(--foreground)]">
              Test what exists now, and what we are about to build next.
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted)]">
              This page keeps the main QA flows in one place: choose a session, jump
              to the report or next daily check-in, run deterministic adaptation
              scenarios, and see exactly what should happen in human language.
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--foreground)]">
              {[
                "Session picker",
                "Daily diary QA",
                "Adaptation previews",
                "Future-ready structure",
              ].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Fast rules
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: "1 bad night only",
                  body: "Should update only that night&apos;s Sleep event. It should not change future guidance.",
                },
                {
                  title: "2 repeated similar nights",
                  body: "Should start changing future guidance for the next few days, but not rewrite past events.",
                },
                {
                  title: "Daily check-in links",
                  body: "Each check-in always belongs to one exact night, even if opened later.",
                },
                {
                  title: "Sleep event after logging",
                  body: "Should change title, description, and actual start/end times, while still keeping the planned window visible in the description.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="panel-lift rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              How to read the adaptation tests
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: "1. Simulated nightly logs",
                  body: "This is the exact check-in data we simulate on specific nights. It is meant to feel like a tiny preview of the real diary backend we will build.",
                },
                {
                  title: "2. Rule engine trace",
                  body: "This explains which rule fired, why it fired, and which future event families it is allowed to touch.",
                },
                {
                  title: "3. User-facing update summary",
                  body: "This is the human-language summary that should later map to report updates, email updates, and main-page updates.",
                },
                {
                  title: "4. Future event diffs",
                  body: "This is the exact before-and-after diff for the future calendar events that would change if that pattern became real.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="panel-lift rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Future backend shape
            </h2>
            <div className="mt-5 grid gap-3">
              {[
                {
                  title: "Diary entries",
                  body: "Each daily check-in belongs to one exact night and becomes one stored log entry with timestamps, pattern labels, and morning state.",
                },
                {
                  title: "Pattern detection",
                  body: "The engine looks only at the recent nightly logs, applies clear thresholds, and decides whether this is one rough night or a repeated pattern.",
                },
                {
                  title: "Change set",
                  body: "If a threshold is met, the engine creates a change set: which future event families are allowed to change and what new copy should replace the old copy.",
                },
                {
                  title: "User-visible outputs",
                  body: "Those changes should later feed three surfaces: the calendar, email updates, and a main-page summary of what changed and why.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="panel-lift rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.body}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </section>

        <section className="glass-panel rounded-[32px] border border-white/75 p-6">
          <h2 className="display text-3xl text-[color:var(--foreground)]">
            Launch / approval checklist
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            Use this before Google production review or a live staging pass. It is a
            human checklist, not an engineering spec.
          </p>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {[
              {
                title: "Public pages are reachable",
                body: "Open the homepage, privacy, terms, and support pages without signing in. Confirm test-only pages stay hidden in production.",
              },
              {
                title: "Staging and prod URLs match Google Cloud",
                body: "Make sure the real domain and any staging domain are exactly the ones entered as OAuth origins and redirect URIs.",
              },
              {
                title: "Google sign-in is ready",
                body: "Confirm AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and the Calendar API scope are present before testing sign-in.",
              },
              {
                title: "Resend can actually send",
                body: "Confirm the sender is verified and not still dependent on the temporary onboarding sender for production traffic.",
              },
              {
                title: "Calendar sync works end to end",
                body: "Finish intake, connect Google, create the calendar, and verify the final result is synced rather than failed.",
              },
              {
                title: "Daily logging is reachable",
                body: "Open a real daily check-in link, submit a past night, and confirm the sleep event title, times, and description update correctly.",
              },
            ].map((item) => (
              <article
                key={item.title}
                className="panel-lift rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
              >
                <p className="font-semibold text-[color:var(--foreground)]">
                  {item.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {item.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] border border-white/75 p-6">
          <h2 className="display text-3xl text-[color:var(--foreground)]">
            Current micro-adjustment rule matrix
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            This is the full set of future-changing rules that exist today. If a
            case is not on this table, it should not change future calendar
            guidance yet.
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                trigger: "Single bad night",
                threshold: "1 rough night only",
                reads: "Any one-night problem",
                changes: "No future change",
                notes:
                  "Only the past Sleep event should update. Future events stay as they are.",
              },
              {
                trigger: "Late start pattern",
                threshold: "2 of the last 3 nights",
                reads: "Late bedtime tags",
                changes: "Digital sunset, Wind-down practice, Sleep window starts",
                notes:
                  "The goal is to tighten the evening runway, not punish one delayed night.",
              },
              {
                trigger: "Sleep-onset pattern",
                threshold: "2 of the last 3 nights",
                reads: "Slow sleep onset or rough mix with long sleep latency",
                changes: "Wind-down practice, In-bed practice",
                notes:
                  "This leans harder on lower-effort settling and thought off-loading.",
              },
              {
                trigger: "Fragmentation pattern",
                threshold: "2 of the last 3 nights",
                reads: "Repeated awakenings, long wake time, or fragmented night pattern",
                changes: "Protected sleep window, In-bed practice, Coach note",
                notes:
                  "This makes overnight reset guidance more explicit for the next few nights.",
              },
              {
                trigger: "Early-wake pattern",
                threshold: "2 of the last 3 nights",
                reads: "Early wake pattern or large early-wake bucket",
                changes: "Wake-up anchor, Morning light, Protected sleep window",
                notes:
                  "This reinforces the morning anchor instead of allowing payback sleep.",
              },
              {
                trigger: "Fatigue pattern",
                threshold: "2 of the last 3 mornings",
                reads: "Running on fumes",
                changes: "Wake-up anchor, Morning light, Daytime movement, Nap boundary",
                notes:
                  "This adds recovery guardrails without extending time in bed.",
              },
            ].map((rule) => (
              <article
                key={rule.trigger}
                className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[0.85fr_0.55fr_0.75fr_1fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Trigger
                    </p>
                    <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                      {rule.trigger}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Threshold
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {rule.threshold}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Reads from logs
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {rule.reads}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Changes
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {rule.changes}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                  {rule.notes}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[32px] border border-white/75 p-6">
          <h2 className="display text-3xl text-[color:var(--foreground)]">
            Weekly structural review policy
          </h2>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            This is the once-per-week structural layer. It only becomes relevant when
            we have enough real nightly data. The preview below shows what each
            bucket means before we ever let it change a live plan.
          </p>
          <div className="mt-5 grid gap-3">
            {[
              {
                bucket: "Expand",
                trigger: "High, stable sleep efficiency across the latest 7-night review window",
                result: "Sleep window grows by 15 minutes and bedtime moves earlier, while wake time stays fixed.",
              },
              {
                bucket: "Hold",
                trigger: "Mixed or mid-range data, low efficiency without steady adherence, or any week that is too sparse or unreliable for a structural move",
                result: "No structural timing change. Keep the plan steady for another week.",
              },
              {
                bucket: "Shrink",
                trigger: "Repeated low efficiency with reasonable adherence across the weekly window",
                result: "Sleep window narrows by 15 minutes and bedtime moves later, while wake time stays fixed.",
              },
            ].map((rule) => (
              <article
                key={rule.bucket}
                className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
              >
                <div className="grid gap-3 lg:grid-cols-[0.4fr_0.8fr_1fr]">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Bucket
                    </p>
                    <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                      {rule.bucket}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Trigger
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {rule.trigger}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      Result
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {rule.result}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Sessions
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              Pick the session you want to inspect. No need to remember ids or hunt
              through URLs.
            </p>

            {allSessions.length ? (
              <div className="mt-5 grid gap-3">
                {allSessions.map((session) => {
                  const isActive = session.id === activeSessionId;
                  return (
                    <Link
                      key={session.id}
                      href={`/test-center?session=${session.id}`}
                      className={`panel-lift rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5 ${
                        isActive
                          ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(245,127,91,.14),rgba(246,198,103,.16))]"
                          : "border-[color:var(--line)] bg-white/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">
                            {session.email ?? "No email captured"}
                          </p>
                          <p className="mt-1 text-sm text-[color:var(--muted)]">
                            Status: {session.status} - Updated {formatTimestamp(session.updatedAt)}
                          </p>
                        </div>
                        <span className="rounded-full bg-[rgba(45,141,143,.12)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--teal)]">
                          {session.timezone}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-[22px] border border-[color:var(--line)] bg-white/85 px-4 py-4 text-sm text-[color:var(--muted)]">
                No sessions yet. Start one from the home page first.
              </p>
            )}
          </section>

          <section className="glass-panel rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Active session snapshot
            </h2>

            {activeSession ? (
              <>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    { label: "Report email", value: activeSession.email ?? "Not captured" },
                    { label: "Plan events", value: String(previewEventCount) },
                    { label: "Sleep logs", value: String(dailyLogCount) },
                    {
                      label: "Calendar sync",
                      value: activeSession.calendarSyncStatus,
                    },
                  ].map((item) => (
                    <article
                      key={item.label}
                      className="panel-lift rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                        {item.label}
                      </p>
                      <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                        {item.value}
                      </p>
                    </article>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/report/${activeSession.id}`}
                    className="panel-lift inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
                  >
                    Open report
                  </Link>
                  {nextCheckIn?.actionUrl ? (
                    <Link
                      href={nextCheckIn.actionUrl}
                      className="panel-lift inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                    >
                      Open next sleep log
                    </Link>
                  ) : null}
                  <Link
                    href="/"
                    className="panel-lift inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                  >
                    Open home page
                  </Link>
                </div>

                <div className="mt-6 grid gap-4 xl:grid-cols-2">
                  <article className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      What to verify quickly
                    </p>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--muted)]">
                      <p>1. Log one night and confirm only that Sleep event changes.</p>
                      <p>2. Run an adaptation preview here before touching the real calendar.</p>
                      <p>3. Only after the preview looks right, test the real calendar flow.</p>
                    </div>
                  </article>
                  <article className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-5">
                    <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                      What comes next
                    </p>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--muted)]">
                      <p>Weekly structural review now has its own preview panel below.</p>
                      <p>Reminder strategy testing will live here too, once we build it.</p>
                      <p>Main-page updates will later be previewable from this same hub.</p>
                    </div>
                  </article>
                </div>
              </>
            ) : (
              <p className="mt-5 rounded-[22px] border border-[color:var(--line)] bg-white/85 px-4 py-4 text-sm text-[color:var(--muted)]">
                Pick a session from the left to load the testing tools for it.
              </p>
            )}
          </section>
        </section>

        {activeSession ? (
          <>
            <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <AdaptationPreviewCard sessionId={activeSession.id} />
            <StructuralReviewPreviewCard sessionId={activeSession.id} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr]">
            <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                Test recipes
              </h2>
              <div className="mt-5 grid gap-3">
                {[
                  {
                    title: "Recipe 1: one bad night only",
                    body: "Run the preview for '1 bad night only'. Expected result: no future plan change. Only the past Sleep event should change after a real log.",
                  },
                  {
                    title: "Recipe 2: repeated late starts",
                    body: "Run '2 late starts'. Expected result: evening runway, screen shutoff, wind-down, and sleep-window guidance should become firmer for the next few days.",
                  },
                  {
                    title: "Recipe 3: repeated fragmented nights",
                    body: "Run '2 fragmented nights'. Expected result: the future plan should strengthen overnight reset language, not move past history.",
                  },
                  {
                    title: "Recipe 4: real calendar smoke test",
                    body: "Only after the preview looks right, log a real completed night and refresh Google Calendar. Verify the old Sleep event changes visually and future events update only when there is a repeated pattern.",
                  },
                  {
                    title: "Recipe 5: combined patterns",
                    body: "Run a mixed scenario such as late start plus slow sleep or fragmented nights plus fatigue. These should show overlapping rule traces and before/after diffs for multiple future event families at once.",
                  },
                  {
                    title: "Recipe 6: weekly structural review",
                    body: "Run a weekly structural scenario such as stable expand, mixed hold, low-efficiency shrink, or sparse-data hold. Expected result: you should see the full 7-night window, the exact logged nights, and a before/after diff for the plan and next-night schedule.",
                  },
                ].map((item) => (
                  <article
                    key={item.title}
                    className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
                  >
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.body}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          </section>
          </>
        ) : null}
      </div>
    </main>
  );
}
