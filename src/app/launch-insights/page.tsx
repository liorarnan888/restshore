import Link from "next/link";
import { notFound } from "next/navigation";

import { brandName } from "@/lib/brand";
import { listAnalyticsEvents, listFeedbackEntries } from "@/lib/launch-data";

function countByEvent(events: Awaited<ReturnType<typeof listAnalyticsEvents>>) {
  return events.reduce<Record<string, number>>((accumulator, event) => {
    accumulator[event.eventType] = (accumulator[event.eventType] ?? 0) + 1;
    return accumulator;
  }, {});
}

function percent(numerator: number, denominator: number) {
  if (!denominator) {
    return "0%";
  }

  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default async function LaunchInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const insightsKey = process.env.LAUNCH_INSIGHTS_KEY;
  const canOpen =
    process.env.NODE_ENV !== "production" || (insightsKey && key === insightsKey);

  if (!canOpen) {
    notFound();
  }

  const [events, feedback] = await Promise.all([
    listAnalyticsEvents(400),
    listFeedbackEntries(120),
  ]);
  const counts = countByEvent(events);
  const pageViews = counts.page_view ?? 0;
  const intakeStarts = counts.intake_started ?? 0;
  const emailCaptures = counts.email_captured ?? 0;
  const reports = counts.report_generated ?? 0;
  const calendarConnects = counts.calendar_connected ?? 0;
  const firstCheckIns = counts.first_checkin_submitted ?? 0;
  const feedbackSubmissions = counts.feedback_submitted ?? 0;

  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-4">
        <header className="flex items-center justify-between rounded-full border border-white/60 bg-white/55 px-4 py-3 text-sm text-[color:var(--muted)] shadow-[0_18px_40px_rgba(31,35,64,0.08)] backdrop-blur md:px-5">
          <div>
            <p className="display text-lg text-[color:var(--foreground)]">
              {brandName} launch insights
            </p>
            <p className="text-xs">Internal review surface for the free public beta</p>
          </div>
          <Link
            href="/"
            className="rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 font-medium text-[color:var(--foreground)]"
          >
            Back home
          </Link>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Page views",
              value: pageViews,
              detail: "Top of funnel",
            },
            {
              label: "Intake starts",
              value: intakeStarts,
              detail: `${percent(intakeStarts, pageViews)} of page views`,
            },
            {
              label: "Reports generated",
              value: reports,
              detail: `${percent(reports, intakeStarts)} of intake starts`,
            },
            {
              label: "Calendar connects",
              value: calendarConnects,
              detail: `${percent(calendarConnects, reports)} of reports`,
            },
            {
              label: "Email captures",
              value: emailCaptures,
              detail: `${percent(emailCaptures, intakeStarts)} of intake starts`,
            },
            {
              label: "First check-ins",
              value: firstCheckIns,
              detail: `${percent(firstCheckIns, calendarConnects)} of calendar connects`,
            },
            {
              label: "Feedback submissions",
              value: feedbackSubmissions,
              detail: `${percent(feedbackSubmissions, pageViews)} of page views`,
            },
          ].map((card) => (
            <article
              key={card.label}
              className="glass-panel editorial-card rounded-[28px] border border-white/75 p-6"
            >
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                {card.label}
              </p>
              <p className="mt-3 text-4xl font-semibold text-[color:var(--foreground)]">
                {card.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {card.detail}
              </p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <article className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Recent feedback
            </h2>
            <div className="mt-5 grid gap-3">
              {feedback.length ? (
                feedback.map((entry) => (
                  <article
                    key={entry.id}
                    className="rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
                      <span>{entry.source}</span>
                      <span>{entry.rating}/5</span>
                      <span>{new Date(entry.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                      {entry.message ?? "No written note"}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                      Session: {entry.sessionId ?? "none"} · Email: {entry.email ?? "not captured"}
                    </p>
                  </article>
                ))
              ) : (
                <p className="text-sm leading-6 text-[color:var(--muted)]">
                  No feedback yet.
                </p>
              )}
            </div>
          </article>

          <article className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Recent analytics
            </h2>
            <div className="mt-5 grid gap-3">
              {events.slice(0, 40).map((event) => (
                <article
                  key={event.id}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
                    {event.eventType}
                  </p>
                  <p className="mt-2 text-sm text-[color:var(--foreground)]">
                    Route: {event.route ?? "unknown"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                    Session: {event.sessionId ?? "none"} · Visitor: {event.visitorId ?? "none"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
