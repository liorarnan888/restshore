import { addMinutes, format } from "date-fns";

import { timeValueFromIso } from "@/lib/daily-checkin";
import type {
  AdaptivePlanSummaryItem,
  DailySleepCheckIn,
  GeneratedPlan,
  ProgramEvent,
} from "@/lib/types";

export type AdaptivePreviewScenario =
  | "single_bad_night"
  | "double_late_start"
  | "double_sleep_onset"
  | "double_fragmented"
  | "double_early_wake"
  | "double_fatigue"
  | "double_late_start_sleep_onset"
  | "double_fragmented_fatigue"
  | "double_early_wake_fatigue";

export type AdaptiveScenarioPreview = {
  scenario: AdaptivePreviewScenario;
  simulatedNightDates: string[];
  simulatedLogs: Array<{
    nightDate: string;
    nightLabel: string;
    summary: string;
    responses: Array<{
      label: string;
      value: string;
    }>;
  }>;
  summary: AdaptivePlanSummaryItem[];
  triggeredRules: Array<{
    id: string;
    title: string;
    detail: string;
    evidence: string;
    affects: string[];
  }>;
  changedEvents: Array<{
    id: string;
    dayLabel: string;
    titleBefore: string;
    titleAfter: string;
    descriptionBefore: string;
    descriptionAfter: string;
  }>;
  shouldAdjustFuturePlan: boolean;
};

type TrendAnalysis = {
  recentEntries: DailySleepCheckIn[];
  lateStartCount: number;
  latencyCount: number;
  fragmentationCount: number;
  earlyWakeCount: number;
  fatigueCount: number;
  lateStartTrend: boolean;
  latencyTrend: boolean;
  fragmentationTrend: boolean;
  earlyWakeTrend: boolean;
  fatigueTrend: boolean;
};

type AdaptivePlanResult = {
  plan: GeneratedPlan;
  changedEventIds: string[];
  summary: AdaptivePlanSummaryItem[];
};

function analyzeRecentEntries(
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  now: Date,
): TrendAnalysis {
  const nowKey = now.toISOString().slice(0, 10);
  const recentEntries = (dailyCheckIns ?? [])
    .filter((entry) => entry.nightDate <= nowKey)
    .sort((left, right) => right.nightDate.localeCompare(left.nightDate))
    .slice(0, 3);

  const hasEnoughPatternData = recentEntries.length >= 2;
  const lateStarts = recentEntries.filter((entry) =>
    entry.derivedTitleTags.includes("late start"),
  ).length;
  const latencyRough = recentEntries.filter(
    (entry) =>
      entry.nightPattern === "slow_sleep" ||
      (entry.nightPattern === "rough_mix" &&
        (entry.sleepLatencyBucket === "40_60" ||
          entry.sleepLatencyBucket === "over_60")),
  ).length;
  const fragmentation = recentEntries.filter(
    (entry) =>
      entry.nightPattern === "several_wakeups" ||
      entry.awakeDuringNightBucket === "40_60" ||
      entry.awakeDuringNightBucket === "over_60" ||
      entry.awakeningsBucket === "3_4" ||
      entry.awakeningsBucket === "5_plus",
  ).length;
  const earlyWake = recentEntries.filter(
    (entry) =>
      entry.nightPattern === "early_wake" ||
      entry.earlyWakeBucket === "60_90" ||
      entry.earlyWakeBucket === "over_90",
  ).length;
  const fatigue = recentEntries.filter(
    (entry) => entry.morningFunction === "running_on_fumes",
  ).length;

  return {
    recentEntries,
    lateStartCount: lateStarts,
    latencyCount: latencyRough,
    fragmentationCount: fragmentation,
    earlyWakeCount: earlyWake,
    fatigueCount: fatigue,
    lateStartTrend: hasEnoughPatternData && lateStarts >= 2,
    latencyTrend: hasEnoughPatternData && latencyRough >= 2,
    fragmentationTrend: hasEnoughPatternData && fragmentation >= 2,
    earlyWakeTrend: hasEnoughPatternData && earlyWake >= 2,
    fatigueTrend: hasEnoughPatternData && fatigue >= 2,
  };
}

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

function buildScenarioEntries(
  plan: GeneratedPlan,
  scenario: AdaptivePreviewScenario,
) {
  const sleepEvents = plan.events
    .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
    .sort((left, right) =>
      plannedStartIso(left).localeCompare(plannedStartIso(right)),
    );
  const targetCount = scenario === "single_bad_night" ? 1 : 2;
  const targetEvents = sleepEvents.slice(0, targetCount);

  if (targetEvents.length < targetCount) {
    throw new Error("Not enough sleep nights in the plan to simulate this scenario.");
  }

  const entries = targetEvents.map((event) => {
    const plannedInBed = timeValueFromIso(plannedStartIso(event), plan.timezone);
    const plannedOutOfBed = timeValueFromIso(plannedEndIso(event), plan.timezone);
    const buildEntry = (entry: Partial<DailySleepCheckIn>) =>
      ({
        nightDate: event.nightDate as string,
        sleepEventId: event.id,
        checkInEventId: `${event.nightDate}-checkin-daily-log`,
        closenessToPlan: "close_to_plan" as const,
        actualInBedTime: plannedInBed,
        actualOutOfBedTime: plannedOutOfBed,
        nightPattern: "fell_asleep_quickly" as const,
        morningFunction: "good_enough" as const,
        derivedTitleTags: [],
        submittedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...entry,
      }) satisfies DailySleepCheckIn;

    switch (scenario) {
      case "single_bad_night":
        return buildEntry({
          closenessToPlan: "bedtime_later",
          actualInBedTime: timeValueFromIso(
            addMinutes(new Date(plannedStartIso(event)), 75).toISOString(),
            plan.timezone,
          ),
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        });
      case "double_late_start":
        return buildEntry({
          closenessToPlan: "bedtime_later",
          actualInBedTime: timeValueFromIso(
            addMinutes(new Date(plannedStartIso(event)), 75).toISOString(),
            plan.timezone,
          ),
          derivedTitleTags: ["late start"],
        });
      case "double_sleep_onset":
        return buildEntry({
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "tired_but_manageable",
        });
      case "double_fragmented":
        return buildEntry({
          nightPattern: "several_wakeups",
          awakeDuringNightBucket: "40_60",
          awakeningsBucket: "3_4",
          morningFunction: "tired_but_manageable",
          derivedTitleTags: ["4 awakenings"],
        });
      case "double_early_wake":
        return buildEntry({
          closenessToPlan: "wake_drifted",
          actualOutOfBedTime: timeValueFromIso(
            addMinutes(new Date(plannedEndIso(event)), -75).toISOString(),
            plan.timezone,
          ),
          nightPattern: "early_wake",
          earlyWakeBucket: "60_90",
          morningFunction: "tired_but_manageable",
          derivedTitleTags: ["early wake"],
        });
      case "double_fatigue":
        return buildEntry({
          morningFunction: "running_on_fumes",
        });
      case "double_late_start_sleep_onset":
        return buildEntry({
          closenessToPlan: "bedtime_later",
          actualInBedTime: timeValueFromIso(
            addMinutes(new Date(plannedStartIso(event)), 75).toISOString(),
            plan.timezone,
          ),
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        });
      case "double_fragmented_fatigue":
        return buildEntry({
          nightPattern: "several_wakeups",
          awakeDuringNightBucket: "40_60",
          awakeningsBucket: "3_4",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["4 awakenings"],
        });
      case "double_early_wake_fatigue":
        return buildEntry({
          closenessToPlan: "wake_drifted",
          actualOutOfBedTime: timeValueFromIso(
            addMinutes(new Date(plannedEndIso(event)), -75).toISOString(),
            plan.timezone,
          ),
          nightPattern: "early_wake",
          earlyWakeBucket: "60_90",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["early wake"],
        });
    }
  });

  const simulatedNow = addMinutes(new Date(plannedEndIso(targetEvents[targetEvents.length - 1])), 60);

  return {
    entries,
    simulatedNow,
    nightDates: targetEvents.map((event) => event.nightDate as string),
  };
}

function nightDateLabel(nightDate: string) {
  const [year, month, day] = nightDate.split("-").map(Number);
  return format(new Date(year, (month ?? 1) - 1, day ?? 1), "EEEE, MMMM d");
}

function closenessLabel(value: DailySleepCheckIn["closenessToPlan"]) {
  switch (value) {
    case "close_to_plan":
      return "Close to plan";
    case "bedtime_later":
      return "Bedtime was later than planned";
    case "wake_drifted":
      return "Wake time drifted";
    case "both_drifted":
      return "Both drifted";
    case "hard_to_say":
      return "Hard to say";
  }
}

function patternLabel(value: DailySleepCheckIn["nightPattern"]) {
  switch (value) {
    case "fell_asleep_quickly":
      return "Fell asleep fairly quickly";
    case "slow_sleep":
      return "Took a while to fall asleep";
    case "several_wakeups":
      return "Woke up several times";
    case "early_wake":
      return "Woke too early";
    case "rough_mix":
      return "Rough mix";
  }
}

function morningFunctionLabel(value: DailySleepCheckIn["morningFunction"]) {
  switch (value) {
    case "good_enough":
      return "Good enough";
    case "tired_but_manageable":
      return "Tired but manageable";
    case "running_on_fumes":
      return "Running on fumes";
  }
}

function latencyLabel(value?: DailySleepCheckIn["sleepLatencyBucket"]) {
  switch (value) {
    case "under_20":
      return "Under 20 minutes";
    case "20_40":
      return "20 to 40 minutes";
    case "40_60":
      return "40 to 60 minutes";
    case "over_60":
      return "More than an hour";
    default:
      return null;
  }
}

function awakeDuringNightLabel(value?: DailySleepCheckIn["awakeDuringNightBucket"]) {
  switch (value) {
    case "under_20":
      return "Under 20 minutes";
    case "20_40":
      return "20 to 40 minutes";
    case "40_60":
      return "40 to 60 minutes";
    case "over_60":
      return "More than an hour";
    default:
      return null;
  }
}

function awakeningsLabel(value?: DailySleepCheckIn["awakeningsBucket"]) {
  switch (value) {
    case "1":
      return "1";
    case "2":
      return "2";
    case "3_4":
      return "3 to 4";
    case "5_plus":
      return "5 or more";
    default:
      return null;
  }
}

function earlyWakeLabel(value?: DailySleepCheckIn["earlyWakeBucket"]) {
  switch (value) {
    case "under_30":
      return "Under 30 minutes";
    case "30_60":
      return "30 to 60 minutes";
    case "60_90":
      return "60 to 90 minutes";
    case "over_90":
      return "More than 90 minutes";
    default:
      return null;
  }
}

function buildSimulatedLogPreview(entry: DailySleepCheckIn) {
  const responses = [
    { label: "Overall fit vs plan", value: closenessLabel(entry.closenessToPlan) },
    { label: "In bed", value: entry.actualInBedTime },
    { label: "Out of bed", value: entry.actualOutOfBedTime },
    { label: "Night pattern", value: patternLabel(entry.nightPattern) },
    { label: "Morning function", value: morningFunctionLabel(entry.morningFunction) },
  ];

  const optionalResponses = [
    latencyLabel(entry.sleepLatencyBucket)
      ? { label: "Sleep onset", value: latencyLabel(entry.sleepLatencyBucket) as string }
      : null,
    awakeDuringNightLabel(entry.awakeDuringNightBucket)
      ? {
          label: "Awake during night",
          value: awakeDuringNightLabel(entry.awakeDuringNightBucket) as string,
        }
      : null,
    awakeningsLabel(entry.awakeningsBucket)
      ? { label: "Awakenings", value: awakeningsLabel(entry.awakeningsBucket) as string }
      : null,
    earlyWakeLabel(entry.earlyWakeBucket)
      ? { label: "Early wake", value: earlyWakeLabel(entry.earlyWakeBucket) as string }
      : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return {
    nightDate: entry.nightDate,
    nightLabel: nightDateLabel(entry.nightDate),
    summary:
      entry.derivedTitleTags.length > 0
        ? `This log would label the past sleep event as: Sleep - ${entry.derivedTitleTags.join(" - ")}`
        : "This log would label the past sleep event as: Sleep",
    responses: [...responses, ...optionalResponses],
  };
}

function buildSummary(analysis: TrendAnalysis): AdaptivePlanSummaryItem[] {
  const summary: AdaptivePlanSummaryItem[] = [];

  if (analysis.lateStartTrend) {
    summary.push({
      id: "late-start",
      title: "Evening runway tightened",
      detail:
        "Your recent logs show bedtime drifting later. The next few evenings now lean harder on earlier shutdown, lower stimulation, and getting into the sleep window on time.",
    });
  }

  if (analysis.latencyTrend) {
    summary.push({
      id: "sleep-onset",
      title: "Sleep-onset guidance updated",
      detail:
        "Because recent nights still show a long runway before sleep, the next in-bed practices lean harder on lower effort, off-loading thoughts, and letting sleep arrive instead of chasing it.",
    });
  }

  if (analysis.fragmentationTrend) {
    summary.push({
      id: "overnight-reset",
      title: "Overnight reset strengthened",
      detail:
        "Recent nights included repeated wake time. Upcoming sleep-window and in-bed guidance now makes the short dim-light reset more explicit so you are not left guessing at 3 AM.",
    });
  }

  if (analysis.earlyWakeTrend) {
    summary.push({
      id: "early-wake",
      title: "Morning anchor reinforced",
      detail:
        "Because early waking showed up in your recent logs, the next mornings now lean harder on holding the wake anchor and not compensating by sleeping in.",
    });
  }

  if (analysis.fatigueTrend) {
    summary.push({
      id: "fatigue",
      title: "Recovery guardrails added",
      detail:
        "Recent mornings looked rough, so the next few days now emphasize light, movement, and tighter nap boundaries instead of paying back sleep with extra time in bed.",
    });
  }

  return summary;
}

function matchingNightLabels(
  entries: DailySleepCheckIn[],
  predicate: (entry: DailySleepCheckIn) => boolean,
) {
  return entries
    .filter(predicate)
    .map((entry) => nightDateLabel(entry.nightDate))
    .slice(0, 3);
}

function joinLabels(labels: string[]) {
  if (!labels.length) {
    return "No nights matched";
  }

  return labels.join(", ");
}

function buildTriggeredRules(analysis: TrendAnalysis) {
  const rules: AdaptiveScenarioPreview["triggeredRules"] = [];

  if (analysis.lateStartTrend) {
    rules.push({
      id: "late-start",
      title: "Late-start pattern threshold met",
      detail:
        "Bedtime drift showed up on at least 2 of the last 3 logged nights, so the next evenings should get firmer runway guidance.",
      evidence: `${analysis.lateStartCount} of the last ${analysis.recentEntries.length} logs showed bedtime starting later than planned: ${joinLabels(
        matchingNightLabels(
          analysis.recentEntries,
          (entry) => entry.derivedTitleTags.includes("late start"),
        ),
      )}.`,
      affects: ["Digital sunset", "Wind-down practice", "Sleep window starts"],
    });
  }

  if (analysis.latencyTrend) {
    rules.push({
      id: "sleep-onset",
      title: "Sleep-onset difficulty threshold met",
      detail:
        "Long sleep-onset showed up repeatedly, so the next practices should lean harder on lower-effort settling and thought off-loading.",
      evidence: `${analysis.latencyCount} of the last ${analysis.recentEntries.length} logs showed slow sleep onset: ${joinLabels(
        matchingNightLabels(
          analysis.recentEntries,
          (entry) =>
            entry.nightPattern === "slow_sleep" ||
            (entry.nightPattern === "rough_mix" &&
              (entry.sleepLatencyBucket === "40_60" ||
                entry.sleepLatencyBucket === "over_60")),
        ),
      )}.`,
      affects: ["Wind-down practice", "In-bed practice"],
    });
  }

  if (analysis.fragmentationTrend) {
    rules.push({
      id: "overnight-reset",
      title: "Fragmented-sleep threshold met",
      detail:
        "Repeated overnight wake time means the next few nights should spell out the overnight reset more clearly.",
      evidence: `${analysis.fragmentationCount} of the last ${analysis.recentEntries.length} logs showed fragmentation: ${joinLabels(
        matchingNightLabels(
          analysis.recentEntries,
          (entry) =>
            entry.nightPattern === "several_wakeups" ||
            entry.awakeDuringNightBucket === "40_60" ||
            entry.awakeDuringNightBucket === "over_60" ||
            entry.awakeningsBucket === "3_4" ||
            entry.awakeningsBucket === "5_plus",
        ),
      )}.`,
      affects: ["Protected sleep window", "In-bed practice", "Coach note"],
    });
  }

  if (analysis.earlyWakeTrend) {
    rules.push({
      id: "early-wake",
      title: "Early-wake threshold met",
      detail:
        "Repeated early finishes should reinforce the morning anchor instead of encouraging payback sleep.",
      evidence: `${analysis.earlyWakeCount} of the last ${analysis.recentEntries.length} logs showed early waking: ${joinLabels(
        matchingNightLabels(
          analysis.recentEntries,
          (entry) =>
            entry.nightPattern === "early_wake" ||
            entry.earlyWakeBucket === "60_90" ||
            entry.earlyWakeBucket === "over_90",
        ),
      )}.`,
      affects: ["Wake-up anchor", "Morning light", "Protected sleep window"],
    });
  }

  if (analysis.fatigueTrend) {
    rules.push({
      id: "fatigue",
      title: "Heavy-morning threshold met",
      detail:
        "Repeated exhausted mornings should add stronger recovery guardrails without extending time in bed.",
      evidence: `${analysis.fatigueCount} of the last ${analysis.recentEntries.length} logs showed heavy morning fatigue: ${joinLabels(
        matchingNightLabels(
          analysis.recentEntries,
          (entry) => entry.morningFunction === "running_on_fumes",
        ),
      )}.`,
      affects: ["Wake-up anchor", "Morning light", "Daytime movement", "Nap boundary"],
    });
  }

  return rules;
}

function appendAdaptiveBlock(
  baseDescription: string,
  heading: string,
  body: string,
) {
  return `${baseDescription}\n\nAdaptive focus\n- ${heading}\n- ${body}`;
}

function withinFutureWindow(event: ProgramEvent, now: Date, daysAhead: number) {
  const eventStart = new Date(event.startsAt).getTime();
  const nowTime = now.getTime();
  const horizon = nowTime + daysAhead * 24 * 60 * 60 * 1000;
  return eventStart > nowTime && eventStart <= horizon;
}

function adaptEvent(
  event: ProgramEvent,
  analysis: TrendAnalysis,
): Pick<ProgramEvent, "title" | "description"> | null {
  const baseTitle = event.baseTitle ?? event.title;
  const baseDescription = event.baseDescription ?? event.description;
  const blocks: Array<{ heading: string; body: string }> = [];

  if (
    analysis.lateStartTrend &&
    (event.eventType === "screen" ||
      event.eventType === "winddown" ||
      event.eventRole === "sleep_window")
  ) {
    blocks.push({
      heading: "Recent logs show bedtime drifting later than planned.",
      body:
        "Start the shutdown earlier than your instincts want tonight. Protect the handoff into dim light and treat the sleep window as a firm appointment.",
    });
  }

  if (
    analysis.latencyTrend &&
    (event.eventRole === "in_bed_practice" || event.eventType === "winddown")
  ) {
    blocks.push({
      heading: "Recent nights still show a long runway before sleep.",
      body:
        "Keep the effort low. Use the practice to hold attention gently instead of checking whether sleep is happening yet.",
    });
  }

  if (
    analysis.fragmentationTrend &&
    (event.eventRole === "sleep_window" ||
      event.eventRole === "in_bed_practice" ||
      event.eventType === "mindset")
  ) {
    blocks.push({
      heading: "Recent nights included more wake time after sleep began.",
      body:
        "If you are clearly awake and getting activated, do not stay in bed negotiating. Take the short dim-light reset and come back when sleepiness returns.",
    });
  }

  if (
    analysis.earlyWakeTrend &&
    (event.eventType === "wake" ||
      event.eventType === "light" ||
      event.eventRole === "sleep_window")
  ) {
    blocks.push({
      heading: "Recent logs show the night ending earlier than you wanted.",
      body:
        "Do not answer an early finish by sleeping in. Keep the wake anchor steady and let tonight's sleep pressure rebuild naturally.",
    });
  }

  if (
    analysis.fatigueTrend &&
    (event.eventType === "nap" ||
      event.eventType === "exercise" ||
      event.eventType === "light" ||
      event.eventType === "wake")
  ) {
    blocks.push({
      heading: "Recent mornings looked especially heavy.",
      body:
        "Use daylight, movement, and a boringly consistent rise time before reaching for extra time in bed. If you truly need a nap, keep it short and early.",
    });
  }

  if (!blocks.length) {
    return {
      title: baseTitle,
      description: baseDescription,
    };
  }

  const description = blocks.reduce(
    (current, block) => appendAdaptiveBlock(current, block.heading, block.body),
    baseDescription,
  );

  return {
    title: baseTitle,
    description,
  };
}

export function adaptPlanFromDailyCheckIns(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  now: Date = new Date(),
): AdaptivePlanResult {
  const analysis = analyzeRecentEntries(dailyCheckIns, now);
  const summary = buildSummary(analysis);

  const touchedByType = new Map<string, number>();
  const changedEventIds: string[] = [];

  const events = plan.events.map((event) => {
    if (!withinFutureWindow(event, now, 5)) {
      return event;
    }

    if (event.eventRole === "daily_checkin" || event.id.includes("checkin-daily-log")) {
      return event;
    }

    const typeKey = event.eventRole ?? event.eventType;
    const alreadyTouched = touchedByType.get(typeKey) ?? 0;

    if (alreadyTouched >= 3) {
      return event;
    }

    const nextContent = adaptEvent(event, analysis);

    if (!nextContent) {
      return event;
    }

    touchedByType.set(typeKey, alreadyTouched + 1);

    if (
      event.title === nextContent.title &&
      event.description === nextContent.description
    ) {
      return event;
    }

    changedEventIds.push(event.id);
    return {
      ...event,
      title: nextContent.title,
      description: nextContent.description,
    };
  });

  if (!changedEventIds.length) {
    return {
      plan,
      changedEventIds,
      summary,
    };
  }

  return {
    plan: {
      ...plan,
      events,
    },
    changedEventIds,
    summary,
  };
}

export function getAdaptivePlanSummary(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  now: Date = new Date(),
) {
  return adaptPlanFromDailyCheckIns(plan, dailyCheckIns, now).summary;
}

export function previewAdaptiveScenario(
  plan: GeneratedPlan,
  scenario: AdaptivePreviewScenario,
): AdaptiveScenarioPreview {
  const builtScenario = buildScenarioEntries(plan, scenario);
  const analysis = analyzeRecentEntries(builtScenario.entries, builtScenario.simulatedNow);
  const adapted = adaptPlanFromDailyCheckIns(
    plan,
    builtScenario.entries,
    builtScenario.simulatedNow,
  );

  const originalEventsById = new Map(plan.events.map((event) => [event.id, event]));

  return {
    scenario,
    simulatedNightDates: builtScenario.nightDates,
    simulatedLogs: builtScenario.entries.map(buildSimulatedLogPreview),
    summary: adapted.summary,
    triggeredRules: buildTriggeredRules(analysis),
    changedEvents: adapted.plan.events
      .filter((event) => adapted.changedEventIds.includes(event.id))
      .slice(0, 8)
      .map((event) => ({
        id: event.id,
        dayLabel: event.dayLabel,
        titleBefore: originalEventsById.get(event.id)?.title ?? event.title,
        titleAfter: event.title,
        descriptionBefore:
          originalEventsById.get(event.id)?.description ?? event.description,
        descriptionAfter: event.description,
      })),
    shouldAdjustFuturePlan: adapted.changedEventIds.length > 0,
  };
}
