import type { ReactNode } from "react";
import { ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { auth } from "@/auth";
import { LaunchPageView } from "@/components/launch/launch-page-view";
import { GoogleConnectCard } from "@/components/report/google-connect-card";
import { brandName } from "@/lib/brand";
import { getAdaptivePlanSummary } from "@/lib/adaptive-plan";
import { isGoogleAuthConfigured } from "@/lib/env";
import { getSession } from "@/lib/session-service";
import type { GeneratedPlan, ProgramEvent, ReportSection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ deliver?: string; connect?: string }>;
}) {
  const { sessionId } = await params;
  const { deliver, connect } = await searchParams;
  const authSession = await auth();
  const session = await getSession(sessionId);

  if (!session || !session.generatedPlan || !session.generatedReport) {
    notFound();
  }

  const report = session.generatedReport;
  const plan = session.generatedPlan;
  const googleConnected =
    session.status === "completed" &&
    session.reportDeliveryStatus !== "failed" &&
    session.calendarSyncStatus !== "failed";
  const shapingSection = findSection(
    report.sections,
    "What appears to be keeping the problem going",
  );
  const doctorSummaryBody =
    findSection(report.sections, "If you decide to get outside help")?.body ??
    `If you ever want outside support, this ${brandName} summary gives you a clearer starting point than trying to describe the whole pattern from memory.`;
  const reportPlanView = plan.reportView;
  const currentPlanView = reportPlanView?.currentPlan;
  const currentWakeTime = currentPlanView?.wakeTime ?? plan.wakeTime;
  const currentBedtimeTarget = currentPlanView?.bedtimeTarget ?? plan.bedtimeTarget;
  const currentSleepWindow = currentPlanView?.sleepWindow ?? plan.sleepWindow;
  const plainPatternSummary = buildPlainPatternSummary(session.answers);
  const startingPlanReason = buildStartingPlanReason({
    answers: session.answers,
    wakeTime: currentWakeTime,
    bedtimeTarget: currentBedtimeTarget,
    sleepWindow: currentSleepWindow,
  });
  const tonightActions = buildTonightActions({
    wakeTime: currentWakeTime,
    windDownStart: plan.windDownStart,
    bedtimeTarget: currentBedtimeTarget,
    sleepWindow: currentSleepWindow,
  });
  const adaptiveSummary = googleConnected
    ? getAdaptivePlanSummary(plan, session.dailyCheckIns).slice(0, 3)
    : [];
  const changeCards = googleConnected
    ? buildReportChangeCards({
        structuralChanges: reportPlanView?.changeSummary ?? [],
        adaptiveSummary,
      })
    : [];
  const calendarPreview = buildCalendarPreview(plan);

  return (
    <main className="relative overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
      <LaunchPageView
        route={`/report/${sessionId}`}
        sessionId={sessionId}
        metadata={{ surface: "report", state: googleConnected ? "connected" : "not_connected" }}
      />
      <div className="pointer-events-none absolute -left-16 top-12 h-56 w-56 rounded-full bg-[rgba(246,198,103,.16)] blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-32 h-72 w-72 rounded-full bg-[rgba(45,141,143,.10)] blur-3xl" />

      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-5">
        <section className="relative overflow-hidden rounded-[36px] border border-white/80 bg-[linear-gradient(145deg,rgba(255,248,239,0.96),rgba(255,255,255,0.92))] px-5 py-6 shadow-[0_24px_64px_rgba(31,35,64,0.10)] sm:px-6 sm:py-7">
          <div className="pointer-events-none absolute -right-12 top-10 h-40 w-40 rounded-full bg-[rgba(45,141,143,.10)] blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-8 h-36 w-36 rounded-full bg-[rgba(245,127,91,.10)] blur-3xl" />

          <div className="relative">
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
              {googleConnected ? "What your plan is doing now" : "What your answers point to"}
            </p>
            <h1 className="display mt-3 text-[2.4rem] leading-[0.98] text-[color:var(--foreground)] sm:text-[3.15rem]">
              {googleConnected ? "Your current sleep plan" : "Your sleep plan starts here"}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted)] sm:text-lg sm:leading-8">
              {plainPatternSummary}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <MetricCard
                label="Regular wake time"
                helper="Wake anchor"
                value={currentWakeTime}
              />
              <MetricCard
                label="Starting bedtime"
                helper="Bedtime target"
                value={currentBedtimeTarget}
              />
              <MetricCard
                label="Time set aside for sleep"
                helper="Protected sleep window"
                value={currentSleepWindow}
              />
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <article className="rounded-[24px] border border-[rgba(31,35,64,.08)] bg-white/86 px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.05)]">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                  Why this plan starts here
                </p>
                <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                  {startingPlanReason}
                </p>
              </article>

              <article className="rounded-[24px] border border-[rgba(31,35,64,.08)] bg-[rgba(45,141,143,.06)] px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.05)]">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                  Start here tonight
                </p>
                <div className="mt-3 grid gap-3">
                  {tonightActions.map((action) => (
                    <div key={action.label} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[color:var(--foreground)]">
                          {action.label}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                          {action.detail}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-semibold text-[color:var(--foreground)]">
                        {action.value}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="mt-5">
              <GoogleConnectCard
                sessionId={session.id}
                variant={googleConnected ? "connected-strip" : "hero-cta"}
                completed={googleConnected}
                authenticated={Boolean(authSession?.user?.id)}
                calendarGranted={Boolean(authSession?.googleCalendarGranted)}
                hasCalendar={Boolean(session.calendarExternalId)}
                googleEmail={authSession?.user?.email}
                authConfigured={isGoogleAuthConfigured()}
                connectOnLoad={connect === "1"}
                deliverOnLoad={deliver === "1"}
                hasFailure={session.reportDeliveryStatus === "failed" || session.calendarSyncStatus === "failed"}
                syncStatus={session.calendarSyncStatus}
                syncState={session.calendarSyncState}
                reportStatus={session.reportDeliveryStatus}
                wakeTime={currentWakeTime}
                bedtimeTarget={currentBedtimeTarget}
                sleepWindow={currentSleepWindow}
                weekTitles={plan.weekSummaries.map((week) => week.title)}
                eventCount={plan.events.length}
              />
            </div>
          </div>
        </section>

        <StorySection
          eyebrow="What seems to be shaping your sleep right now"
          title="What seems to be shaping your sleep right now"
          body={shapingSection?.body}
          className="bg-[rgba(255,255,255,0.92)]"
        >
          {shapingSection?.bullets?.length ? (
            <div className="mt-5 grid gap-3">
              {shapingSection.bullets.slice(0, 5).map((bullet) => (
                <article
                  key={bullet}
                  className="rounded-[22px] border border-[rgba(31,35,64,.08)] bg-[rgba(245,127,91,.08)] px-4 py-4"
                >
                  <p className="text-sm leading-6 text-[color:var(--foreground)]">{bullet}</p>
                </article>
              ))}
            </div>
          ) : null}
        </StorySection>

        <StorySection
          eyebrow={googleConnected ? "Your current 6-week plan" : "Your 6-week plan"}
          title={
            googleConnected
              ? "The structure you are following now"
              : "The structure of your next 6 weeks"
          }
          body={
            googleConnected
              ? "This is the current version of the structure your calendar is following."
              : "This is the starting structure built from your answers. It is meant to become easier to follow before it becomes broader."
          }
          className="bg-[rgba(255,252,246,0.94)]"
        >
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {(currentPlanView?.weekArc ?? plan.weekSummaries).map((week) => (
              <article
                key={week.weekNumber}
                className="rounded-[24px] border border-[rgba(31,35,64,.08)] bg-white/90 px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.05)]"
              >
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
                  Week {week.weekNumber}
                </p>
                <h3 className="mt-2 text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                  {week.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                  {week.focus}
                </p>
              </article>
            ))}
          </div>
        </StorySection>

        {googleConnected && changeCards.length > 0 ? (
          <StorySection
            eyebrow="What changed and why"
            title="What changed and why"
            body="When the same sleep pattern shows up more than once, the next part of the plan can tighten or reinforce itself instead of staying static."
            className="bg-[rgba(245,249,249,0.92)]"
          >
            <div className="mt-5 grid gap-3">
              {changeCards.map((item) => (
                <article
                  key={item.key}
                  className="rounded-[24px] border border-[rgba(45,141,143,.12)] bg-white/88 px-4 py-4 shadow-[0_12px_28px_rgba(31,35,64,0.05)]"
                >
                  <h3 className="text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                  {item.meta ? (
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
                      {item.meta}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          </StorySection>
        ) : null}

        {!googleConnected && calendarPreview.length ? (
          <StorySection
            eyebrow="What the calendar adds"
            title="What becomes easier once the plan is on your calendar"
            body="The calendar is what makes the plan easier to follow in real life. It carries your wake time, wind-down, sleep window, and morning log into your week, and it is what enables future check-ins to keep the plan updated."
            className="bg-[rgba(245,249,249,0.92)]"
          >
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {calendarPreview.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[24px] border border-[rgba(45,141,143,.12)] bg-white/88 px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.05)]"
                >
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
                    {item.label}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                </article>
              ))}
            </div>
          </StorySection>
        ) : null}

        <StorySection
          eyebrow="Doctor-ready summary"
          title="A version you can reuse if you need outside help"
          body={doctorSummaryBody}
        >
          <article className="mt-6 rounded-[24px] border border-[rgba(31,35,64,.08)] bg-[rgba(255,249,241,0.92)] px-5 py-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
              Summary you can share
            </p>
            <ul className="mt-4 grid gap-3">
              {report.clinicianSummary.slice(0, 4).map((line) => (
                <li
                  key={line}
                  className="rounded-[18px] border border-[rgba(31,35,64,.08)] bg-white/90 px-4 py-3 text-sm leading-6 text-[color:var(--foreground)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </article>

          {report.safetyNote ? (
            <div className="mt-5 rounded-[24px] border border-[rgba(235,93,52,.16)] bg-[rgba(245,127,91,.12)] px-5 py-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 text-[color:var(--accent-strong)]" />
                <p className="text-sm leading-6 text-[color:var(--foreground)]">
                  {report.safetyNote}
                </p>
              </div>
            </div>
          ) : null}
        </StorySection>
      </div>
    </main>
  );
}

function findSection(sections: ReportSection[], title: string) {
  return sections.find((section) => section.title === title);
}

function buildCalendarPreview(plan: GeneratedPlan) {
  const previewFamilies: Array<{
    label: string;
    title: string;
    detail: string;
    match: (event: ProgramEvent) => boolean;
  }> = [
    {
      label: "Regular wake time",
      title: "Wake anchor",
      detail: "Shows the same get-up time each day so the rhythm becomes easier to hold in real life.",
      match: (event: ProgramEvent) => event.eventType === "wake",
    },
    {
      label: "Wind-down",
      title: "Wind-down practice",
      detail: "Adds one clear evening cue so bedtime feels calmer and less effortful.",
      match: (event: ProgramEvent) => event.eventType === "winddown",
    },
    {
      label: "Sleep time",
      title: "Protected sleep window",
      detail: "Blocks the starting time set aside for sleep and keeps the instructions attached to it.",
      match: (event: ProgramEvent) =>
        event.eventRole === "sleep_window" || event.eventType === "bed",
    },
    {
      label: "Morning sleep log",
      title: "Morning sleep log",
      detail: "Adds a quick next-morning check-in so the plan can keep adjusting to real nights.",
      match: (event: ProgramEvent) =>
        event.eventRole === "daily_checkin" || event.eventType === "checkin",
    },
  ];

  return previewFamilies
    .map((family) => {
      const event = plan.events.find(family.match);

      if (!event) {
        return null;
      }

      return {
        label: family.label,
        title: family.title,
        detail: family.detail,
      };
    })
    .filter((item): item is { label: string; title: string; detail: string } => Boolean(item));
}

function buildReportChangeCards({
  structuralChanges,
  adaptiveSummary,
}: {
  structuralChanges: NonNullable<GeneratedPlan["reportView"]>["changeSummary"];
  adaptiveSummary: Array<{ id: string; title: string; detail: string }>;
}) {
  if (structuralChanges.length > 0) {
    return structuralChanges.map((change, index) => ({
      key: `structural-${index}`,
      title: change.title,
      detail: change.why,
      meta: `Starts ${formatEffectiveDate(change.effectiveDate)}`,
    }));
  }

  return adaptiveSummary.map((item) => ({
    key: item.id,
    title: item.title,
    detail: item.detail,
    meta: "Near-term plan update",
  }));
}

function formatEffectiveDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

function MetricCard({
  label,
  helper,
  value,
}: {
  label: string;
  helper: string;
  value: string;
}) {
  return (
    <article className="rounded-[24px] border border-white/80 bg-white/84 px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.06)]">
      <p className="text-sm text-[color:var(--muted)]">{label}</p>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
        {helper}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[color:var(--foreground)]">{value}</p>
    </article>
  );
}

function getAnswerValue(
  answers: Record<string, string | string[]>,
  key: string,
) {
  const value = answers[key];
  return Array.isArray(value) ? value[0] : value;
}

function buildPlainPatternSummary(answers: Record<string, string | string[]>) {
  const primaryProblem = getAnswerValue(answers, "primary_problem");
  const daytimeImpact = getAnswerValue(answers, "daytime_impact");

  const primaryProblemLabel =
    primaryProblem === "falling_asleep"
      ? "trouble getting sleep started"
      : primaryProblem === "night_wakings"
        ? "sleep that breaks during the night"
        : primaryProblem === "early_waking"
          ? "waking too early and not getting back to sleep"
          : primaryProblem === "irregular_schedule"
            ? "sleep timing that drifts too much"
            : "a sleep pattern that needs more structure";

  const impactLabel =
    daytimeImpact === "mild"
      ? "mild daytime strain"
      : daytimeImpact === "moderate"
        ? "noticeable daytime strain"
        : daytimeImpact === "high"
          ? "clear daytime strain"
          : daytimeImpact === "severe"
            ? "heavy daytime strain"
            : "daytime strain";

  return `Your answers point most strongly to ${primaryProblemLabel}, with ${impactLabel} around it. The goal now is to make your nights steadier, more predictable, and easier to follow in real life.`;
}

function parseTimeToMinutes(value?: string) {
  if (!value) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function parseSleepWindowToHours(value: string) {
  const match = /(\d+)(?:\.(\d+))?\s*hours?/i.exec(value);

  if (!match) {
    return null;
  }

  return Number(`${match[1]}.${match[2] ?? "0"}`);
}

function estimatedTimeInBedHours(timeInBed?: string) {
  switch (timeInBed) {
    case "under_6":
      return 5.5;
    case "6_7":
      return 6.5;
    case "7_8":
      return 7.5;
    case "8_9":
      return 8.5;
    case "over_9":
      return 9.5;
    default:
      return null;
  }
}

function buildStartingPlanReason({
  answers,
  wakeTime,
  bedtimeTarget,
  sleepWindow,
}: {
  answers: Record<string, string | string[]>;
  wakeTime: string;
  bedtimeTarget: string;
  sleepWindow: string;
}) {
  const primaryProblem = getAnswerValue(answers, "primary_problem");
  const usualBedtime = getAnswerValue(answers, "usual_bedtime");
  const timeInBed = getAnswerValue(answers, "time_in_bed");
  const weekendWakeShift = getAnswerValue(answers, "weekend_wake_shift");

  const bedtimeLater =
    parseTimeToMinutes(bedtimeTarget) !== null &&
    parseTimeToMinutes(usualBedtime) !== null &&
    parseTimeToMinutes(bedtimeTarget)! > parseTimeToMinutes(usualBedtime)!;
  const windowLooksTighter =
    parseSleepWindowToHours(sleepWindow) !== null &&
    estimatedTimeInBedHours(timeInBed) !== null &&
    parseSleepWindowToHours(sleepWindow)! < estimatedTimeInBedHours(timeInBed)!;

  if (bedtimeLater || windowLooksTighter) {
    return "We’re starting with a tighter time-in-bed window so sleep becomes more predictable before we widen it again.";
  }

  if (primaryProblem === "irregular_schedule" || weekendWakeShift === "1_2_hours" || weekendWakeShift === "over_2_hours") {
    return `We’re starting by making your timing steadier around a regular ${wakeTime} wake time so nights stop feeling random.`;
  }

  if (primaryProblem === "falling_asleep") {
    return "We’re starting with clearer evening boundaries and a firmer bedtime so sleep can begin with less effort.";
  }

  if (primaryProblem === "night_wakings" || primaryProblem === "early_waking") {
    return "We’re starting with steadier timing and cleaner sleep cues so the night becomes less fragmented over time.";
  }

  return "We’re starting with the smallest structure most likely to make sleep feel steadier before we expand anything.";
}

function buildTonightActions({
  wakeTime,
  windDownStart,
  bedtimeTarget,
  sleepWindow,
}: {
  wakeTime: string;
  windDownStart: string;
  bedtimeTarget: string;
  sleepWindow: string;
}) {
  return [
    {
      label: "Wake time tomorrow",
      value: wakeTime,
      detail: "Keep this steady, even after a rough night.",
    },
    {
      label: "Wind-down start",
      value: windDownStart,
      detail: "Start reducing stimulation and unfinished tasks here.",
    },
    {
      label: "Sleep time tonight",
      value: bedtimeTarget,
      detail: `Use this as the start of your ${sleepWindow} time set aside for sleep.`,
    },
  ];
}

function StorySection({
  eyebrow,
  title,
  body,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  body?: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[32px] border border-white/80 bg-white/90 px-5 py-6 shadow-[0_18px_44px_rgba(31,35,64,0.08)] sm:px-6 sm:py-7 ${className}`.trim()}
    >
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--teal)]">
        {eyebrow}
      </p>
      <h2 className="display mt-3 text-[2rem] leading-[1.02] text-[color:var(--foreground)] sm:text-[2.4rem]">
        {title}
      </h2>
      {body ? (
        <p className="mt-4 max-w-3xl text-base leading-7 text-[color:var(--muted)]">
          {body}
        </p>
      ) : null}
      {children}
    </section>
  );
}
