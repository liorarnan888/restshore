import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock3, Mail, ShieldAlert } from "lucide-react";

import { auth } from "@/auth";
import { BetaFeedbackCard } from "@/components/launch/beta-feedback-card";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import { AdaptationPreviewCard } from "@/components/report/adaptation-preview-card";
import { GoogleConnectCard } from "@/components/report/google-connect-card";
import { RetakeAssessmentButton } from "@/components/report/retake-assessment-button";
import { brandName } from "@/lib/brand";
import { isGoogleAuthConfigured } from "@/lib/env";
import { getAdaptivePlanSummary } from "@/lib/adaptive-plan";
import { getSession } from "@/lib/session-service";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ deliver?: string; connect?: string; feedback?: string }>;
}) {
  const { sessionId } = await params;
  const { deliver, connect, feedback } = await searchParams;
  const authSession = await auth();
  const session = await getSession(sessionId);

  if (!session || !session.generatedPlan || !session.generatedReport) {
    notFound();
  }

  const report = session.generatedReport;
  const plan = session.generatedPlan;
  const previewEvents = plan.events
    .filter((event) => event.eventType !== "checkin")
    .slice(0, 8);
  const loggedNightDates = new Set(
    (session.dailyCheckIns ?? []).map((entry) => entry.nightDate),
  );
  const nextCheckInEvent = plan.events.find(
    (event) =>
      event.eventRole === "daily_checkin" &&
      event.actionUrl &&
      event.nightDate &&
      !loggedNightDates.has(event.nightDate),
  );
  const previewWeeks = plan.weekSummaries.slice(0, 3);
  const adaptiveSummary = getAdaptivePlanSummary(plan, session.dailyCheckIns);
  const hasDeliveryFailure =
    session.reportDeliveryStatus === "failed" ||
    session.calendarSyncStatus === "failed";
  const isSyncing = session.calendarSyncStatus === "syncing";
  const deliveryCompleted = session.status === "completed" && !hasDeliveryFailure;
  const feedbackSource = feedback === "followup" ? "followup_email" : "report";

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <LaunchPageView
        route={`/report/${sessionId}${feedback ? `?feedback=${feedback}` : ""}`}
        sessionId={sessionId}
        metadata={{ surface: "report" }}
      />
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="glass-panel relative overflow-hidden rounded-[36px] border border-white/75 p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-16 top-12 h-48 w-48 rounded-full bg-[rgba(45,141,143,.10)] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-12 h-40 w-40 rounded-full bg-[rgba(245,127,91,.10)] blur-3xl" />

          <div className="rounded-[28px] bg-[linear-gradient(140deg,rgba(245,127,91,.14),rgba(246,198,103,.22))] p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
              Your {brandName} sleep summary
            </p>
            <h1 className="display mt-3 text-5xl leading-[1.05] text-[color:var(--foreground)]">
              {report.headline}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[color:var(--muted)]">
              {report.summary}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--foreground)]">
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5">
                6-week beta
              </span>
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5">
                sleep summary
              </span>
              <span className="rounded-full border border-white/80 bg-white/80 px-3 py-1.5">
                calendar guidance
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { label: "Wake anchor", value: plan.wakeTime },
              { label: "Bedtime target", value: plan.bedtimeTarget },
              { label: "Protected sleep window", value: plan.sleepWindow },
            ].map((item) => (
              <article
                key={item.label}
                className="editorial-card panel-lift rounded-[24px] border border-white/70 p-5"
              >
                <p className="text-sm text-[color:var(--muted)]">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">
                  {item.value}
                </p>
              </article>
            ))}
          </div>

          <div className="editorial-card mt-8 rounded-[30px] border border-[color:var(--line)] p-6">
            <h2 className="display ink-divider text-3xl text-[color:var(--foreground)]">
              Sleep summary snapshot
            </h2>
            <ul className="mt-6 grid gap-3">
              {report.clinicianSummary.map((insight) => (
                <li
                  key={insight}
                  className="panel-lift rounded-[22px] bg-[rgba(45,141,143,.08)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]"
                >
                  {insight}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 grid gap-4">
            {report.sections.map((section) => (
              <article
                key={section.title}
                className="editorial-card rounded-[28px] border border-[color:var(--line)] p-6"
              >
                <h2 className="display ink-divider text-3xl text-[color:var(--foreground)]">
                  {section.title}
                </h2>
                <p className="mt-6 text-base leading-7 text-[color:var(--muted)]">
                  {section.body}
                </p>
                {section.bullets?.length ? (
                  <ul className="mt-4 grid gap-3">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet}
                        className="panel-lift rounded-[22px] border border-[rgba(31,35,64,.08)] bg-[rgba(245,127,91,.08)] px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]"
                      >
                        {bullet}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>

          {report.safetyNote ? (
            <div className="mt-8 rounded-[28px] border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.14)] p-6">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 text-[color:var(--accent-strong)]" />
                <div>
                  <h2 className="display text-2xl text-[color:var(--foreground)]">
                    A note to keep in mind
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-[color:var(--foreground)]">
                    {report.safetyNote}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="flex flex-col gap-6 lg:sticky lg:top-6 lg:self-start">
          <GoogleConnectCard
            sessionId={session.id}
            completed={deliveryCompleted}
            authenticated={Boolean(authSession?.user?.id)}
            calendarGranted={Boolean(authSession?.googleCalendarGranted)}
            canRemoveCalendar={Boolean(session.calendarExternalId)}
            googleEmail={authSession?.user?.email}
            authConfigured={isGoogleAuthConfigured()}
            connectOnLoad={connect === "1"}
            deliverOnLoad={deliver === "1"}
            hasFailure={hasDeliveryFailure}
            syncStatus={session.calendarSyncStatus}
            syncState={session.calendarSyncState}
            reportStatus={session.reportDeliveryStatus}
            wakeTime={plan.wakeTime}
            bedtimeTarget={plan.bedtimeTarget}
            sleepWindow={plan.sleepWindow}
            weekTitles={plan.weekSummaries.map((week) => week.title)}
            eventCount={plan.events.length}
          />

          <BetaFeedbackCard
            source={feedbackSource}
            sessionId={session.id}
            email={session.email}
            title={
              feedbackSource === "followup_email"
                ? "Thanks for coming back to the beta"
                : `How is ${brandName} feeling so far?`
            }
            description={
              feedbackSource === "followup_email"
                ? "Tell us what has felt useful, confusing, too heavy, or surprisingly calming since you started."
                : "This beta is free while we learn. If the report, calendar setup, or overall tone feels strong or shaky, tell us in plain language."
            }
          />

          <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Beta guardrails
            </h2>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              This is a free public beta with no billing in the current version. Keep the
              framing consumer-first and non-medical.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <Link
                href="/privacy"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)]"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="rounded-full border border-[color:var(--line)] bg-white/85 px-4 py-2 font-medium text-[color:var(--foreground)]"
              >
                Terms
              </Link>
            </div>
          </section>

          {process.env.NODE_ENV !== "production" ? (
            <Link
              href={`/test-center?session=${session.id}`}
              className="panel-lift inline-flex items-center justify-center rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
            >
              Open Test Center For This Session
            </Link>
          ) : null}

          {process.env.NODE_ENV !== "production" ? (
            <AdaptationPreviewCard sessionId={session.id} />
          ) : null}

          <RetakeAssessmentButton sessionId={session.id} />

          {nextCheckInEvent?.actionUrl ? (
            <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                Morning sleep log
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                Use one short morning log to record what actually happened and let the
                calendar stay aligned with real sleep.
              </p>
              <div className="mt-4 rounded-[24px] border border-[color:var(--line)] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                  {nextCheckInEvent.dayLabel}
                </p>
                <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                  {nextCheckInEvent.title}
                </p>
              </div>
              <Link
                href={nextCheckInEvent.actionUrl}
                className="panel-lift mt-5 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
              >
                Open sleep log
              </Link>
            </section>
          ) : null}

          {adaptiveSummary.length ? (
            <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
              <h2 className="display text-3xl text-[color:var(--foreground)]">
                Recent plan adjustments
              </h2>
              <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                These are the light changes now shaping the next few days based on your
                recent sleep logs.
              </p>
              <div className="mt-5 grid gap-3">
                {adaptiveSummary.map((item) => (
                  <article
                    key={item.id}
                    className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
                  >
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          ) : null}

          <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Delivery status
            </h2>
            <div className="mt-5 grid gap-3">
              <StatusRow
                icon={CalendarDays}
                label="Calendar sync"
                value={isSyncing ? "syncing" : session.calendarSyncStatus}
              />
              <StatusRow
                icon={Clock3}
                label="Resume reminder"
                value={session.reminderSentAt ? "sent" : "scheduled"}
              />
              <StatusRow
                icon={Mail}
                label="Feedback follow-up"
                value={
                  session.feedbackFollowUpSentAt
                    ? "sent"
                    : session.feedbackFollowUpQueuedAt
                      ? "scheduled"
                      : "not queued"
                }
              />
            </div>
          </section>

          <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              6-week roadmap
            </h2>
            <div className="mt-5 grid gap-3">
              {previewWeeks.map((week) => (
                <article
                  key={week.weekNumber}
                  className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                    Week {week.weekNumber}
                  </p>
                  <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                    {week.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {week.focus}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              First calendar cues
            </h2>
            <div className="mt-5 grid gap-3">
              {previewEvents.map((event) => (
                <article
                  key={event.id}
                  className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                    Week {event.weekNumber} · {event.dayLabel}
                  </p>
                  <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                    {event.title}
                  </p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--muted)]">
                    {event.description}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </main>
  );
}

function StatusRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="panel-lift flex items-center justify-between rounded-[22px] border border-[color:var(--line)] bg-white/85 px-4 py-3">
      <div className="flex items-center gap-3 text-[color:var(--foreground)]">
        <Icon className="h-4 w-4 text-[color:var(--teal)]" />
        <span>{label}</span>
      </div>
      <span className="rounded-full bg-[rgba(45,141,143,.12)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--teal)]">
        {value}
      </span>
    </div>
  );
}
