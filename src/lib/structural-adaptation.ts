import { format, set } from "date-fns";

import { nightDateFromIso, timeValueFromIso } from "@/lib/daily-checkin";
import type { DailySleepCheckIn, GeneratedPlan, ProgramEvent, SleepProfile } from "@/lib/types";

export type WeeklyStructuralReviewBucket = "expand" | "hold" | "shrink";

export type WeeklyStructuralReviewReasonCode =
  | "insufficient_logs"
  | "high_stable_efficiency"
  | "mid_range_or_mixed"
  | "low_efficiency_repeated"
  | "poor_adherence_for_low_efficiency"
  | "contradictory_data"
  | "context_shift"
  | "red_flags"
  | "severe_daytime_impairment";

export type WeeklyStructuralReviewContext = {
  timeZone?: string;
  redFlags?: string[];
  contextShiftFlags?: string[];
  severeDaytimeImpairment?: boolean;
  notes?: string[];
  profile?: Pick<SleepProfile, "redFlags" | "cautionFlags" | "sleepMedication" | "timezone">;
};

export type WeeklyStructuralReviewDecision = {
  bucket: WeeklyStructuralReviewBucket;
  reasonCode: WeeklyStructuralReviewReasonCode;
  reason: string;
  effectiveDate: string;
  proposedSleepWindowDeltaMinutes: number;
  explanatorySummary: string;
  metrics: {
    completedLogs: number;
    totalWindowNights: number;
    windowStartNightDate: string | null;
    windowEndNightDate: string | null;
    averageEfficiency: number;
    efficiencyRange: [number, number];
    highEfficiencyNights: number;
    lowEfficiencyNights: number;
    adherenceScore: number;
    reasonableAdherence: boolean;
  };
  evidence: string[];
};

export type WeeklyStructuralReviewPreview = {
  decision: WeeklyStructuralReviewDecision;
  currentSleepWindowMinutes: number;
  projectedSleepWindowMinutes: number;
  currentBedtimeTarget: string;
  projectedBedtimeTarget: string;
  currentWakeAnchor: string;
  projectedWakeAnchor: string;
  wakeAnchorFixed: boolean;
};

type WindowNight = {
  event: ProgramEvent;
  log?: DailySleepCheckIn;
};

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

function parseClockMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);
}

function formatClockMinutes(value: number) {
  const normalized = ((value % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function formatClockLabel(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  const date = set(new Date(), {
    hours: Number.isFinite(hours) ? hours : 0,
    minutes: Number.isFinite(minutes) ? minutes : 0,
    seconds: 0,
    milliseconds: 0,
  });

  return format(date, "h:mm a");
}

function clockDifferenceMinutes(reference: string, actual: string) {
  let difference = parseClockMinutes(actual) - parseClockMinutes(reference);

  if (difference > 720) {
    difference -= 1440;
  }

  if (difference < -720) {
    difference += 1440;
  }

  return difference;
}

function clockDurationMinutes(start: string, end: string) {
  let difference = parseClockMinutes(end) - parseClockMinutes(start);

  if (difference <= 0) {
    difference += 1440;
  }

  return difference;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function sleepLatencyMinutes(entry: DailySleepCheckIn) {
  switch (entry.sleepLatencyBucket) {
    case "under_20":
      return 15;
    case "20_40":
      return 30;
    case "40_60":
      return 50;
    case "over_60":
      return 75;
  }

  switch (entry.nightPattern) {
    case "fell_asleep_quickly":
      return 15;
    case "slow_sleep":
      return 45;
    case "rough_mix":
      return 30;
    case "several_wakeups":
      return 20;
    case "early_wake":
      return 15;
  }

  return 30;
}

function wakeTimeMinutes(entry: DailySleepCheckIn) {
  switch (entry.awakeDuringNightBucket) {
    case "under_20":
      return 10;
    case "20_40":
      return 25;
    case "40_60":
      return 40;
    case "over_60":
      return 60;
  }

  switch (entry.awakeningsBucket) {
    case "1":
      return 8;
    case "2":
      return 18;
    case "3_4":
      return 32;
    case "5_plus":
      return 48;
  }

  switch (entry.nightPattern) {
    case "several_wakeups":
      return 30;
    case "rough_mix":
      return 15;
    default:
      return 0;
  }
}

function estimateSleepEfficiency(
  entry: DailySleepCheckIn,
  sleepEvent: ProgramEvent,
  timeZone: string,
) {
  const sleepOpportunityMinutes = clockDurationMinutes(
    entry.actualInBedTime,
    entry.actualOutOfBedTime,
  );
  const latency = sleepLatencyMinutes(entry);
  const wakeTime = wakeTimeMinutes(entry);
  const estimatedSleepMinutes = clamp(sleepOpportunityMinutes - latency - wakeTime, 0, 1440);
  const plannedBedtime = timeValueFromIso(plannedStartIso(sleepEvent), timeZone);
  const plannedWakeTime = timeValueFromIso(plannedEndIso(sleepEvent), timeZone);

  return {
    sleepOpportunityMinutes,
    estimatedSleepMinutes,
    efficiency: sleepOpportunityMinutes
      ? (estimatedSleepMinutes / sleepOpportunityMinutes) * 100
      : 0,
    bedDriftMinutes: Math.abs(clockDifferenceMinutes(plannedBedtime, entry.actualInBedTime)),
    wakeDriftMinutes: Math.abs(clockDifferenceMinutes(plannedWakeTime, entry.actualOutOfBedTime)),
  };
}

function planTimeZone(plan: GeneratedPlan, context?: WeeklyStructuralReviewContext) {
  return context?.timeZone ?? context?.profile?.timezone ?? plan.timezone;
}

function getCompletedWindowSleepEvents(plan: GeneratedPlan, now: Date) {
  return plan.events
    .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
    .filter((event) => new Date(plannedEndIso(event)).getTime() <= now.getTime())
    .sort((left, right) => plannedStartIso(left).localeCompare(plannedStartIso(right)))
    .slice(-7);
}

function getUpcomingSleepEvent(plan: GeneratedPlan, now: Date) {
  return (
    plan.events
      .filter((event) => event.eventRole === "sleep_window")
      .filter((event) => new Date(plannedStartIso(event)).getTime() > now.getTime())
      .sort((left, right) => plannedStartIso(left).localeCompare(plannedStartIso(right)))[0] ?? null
  );
}

function collectStructuralWindow(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  now: Date,
) {
  const sleepEvents = getCompletedWindowSleepEvents(plan, now);
  const sleepEventsByNight = new Map(
    sleepEvents.map((event) => [event.nightDate as string, event]),
  );
  const windowLogs = (dailyCheckIns ?? [])
    .filter((entry) => sleepEventsByNight.has(entry.nightDate))
    .sort((left, right) => left.nightDate.localeCompare(right.nightDate));

  const nights = sleepEvents.map((event) => ({
    event,
    log: windowLogs.find((entry) => entry.nightDate === event.nightDate),
  }));

  return {
    sleepEvents,
    nights,
    windowLogs,
    completedLogs: windowLogs.length,
    totalWindowNights: sleepEvents.length,
  };
}

type NoChangeSignal = {
  reasonCode: WeeklyStructuralReviewReasonCode;
  reason: string;
};

function detectContradictions(
  logs: DailySleepCheckIn[],
  plan: GeneratedPlan,
  timeZone: string,
) {
  const issues: string[] = [];
  const planEventsByNight = new Map(
    plan.events
      .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
      .map((event) => [event.nightDate as string, event]),
  );

  for (const entry of logs) {
    const sleepEvent = planEventsByNight.get(entry.nightDate);

    if (!sleepEvent) {
      issues.push(`${entry.nightDate}: missing sleep event for logged night`);
      continue;
    }

    const plannedBedtime = timeValueFromIso(plannedStartIso(sleepEvent), timeZone);
    const plannedWakeTime = timeValueFromIso(plannedEndIso(sleepEvent), timeZone);
    const bedDrift = clockDifferenceMinutes(plannedBedtime, entry.actualInBedTime);
    const wakeDrift = clockDifferenceMinutes(plannedWakeTime, entry.actualOutOfBedTime);
    const sleepOpportunityMinutes = clockDurationMinutes(
      entry.actualInBedTime,
      entry.actualOutOfBedTime,
    );
    const latency = sleepLatencyMinutes(entry);

    if (sleepOpportunityMinutes < 120 || sleepOpportunityMinutes > 960) {
      issues.push(`${entry.nightDate}: implausible sleep opportunity`);
    }

    if (
      entry.closenessToPlan === "close_to_plan" &&
      (Math.abs(bedDrift) > 90 || Math.abs(wakeDrift) > 90)
    ) {
      issues.push(`${entry.nightDate}: closeness label conflicts with actual times`);
    }

    if (entry.nightPattern === "fell_asleep_quickly" && latency >= 45) {
      issues.push(`${entry.nightDate}: sleep-onset label conflicts with latency`);
    }

    if (entry.nightPattern === "slow_sleep" && latency <= 15) {
      issues.push(`${entry.nightDate}: slow-sleep label conflicts with latency`);
    }

    if (entry.nightPattern === "several_wakeups" && wakeTimeMinutes(entry) < 20) {
      issues.push(`${entry.nightDate}: fragmentation label conflicts with wake time`);
    }
  }

  return issues;
}

function collectNoChangeSignals(
  windowLogs: DailySleepCheckIn[],
  contradictions: string[],
  context: WeeklyStructuralReviewContext | undefined,
): NoChangeSignal[] {
  const signals: NoChangeSignal[] = [];
  const redFlags = [
    ...(context?.redFlags ?? []),
    ...(context?.profile?.redFlags ?? []),
    ...(context?.profile?.cautionFlags ?? []),
  ].filter((flag) => flag !== "none");

  if (redFlags.length > 0) {
    signals.push({
      reasonCode: "red_flags",
      reason: `Red flags are present: ${redFlags.join(", ")}.`,
    });
  }

  if (context?.severeDaytimeImpairment) {
    signals.push({
      reasonCode: "severe_daytime_impairment",
      reason: "Severe daytime impairment was flagged for this review.",
    });
  }

  if ((context?.contextShiftFlags ?? []).length > 0) {
    signals.push({
      reasonCode: "context_shift",
      reason: `Context shift flags were present: ${(context?.contextShiftFlags ?? []).join(", ")}.`,
    });
  }

  if (contradictions.length > 0) {
    signals.push({
      reasonCode: "contradictory_data",
      reason: `The diary contains contradictory entries: ${contradictions.slice(0, 3).join("; ")}.`,
    });
  }

  if (windowLogs.length < 5) {
    signals.push({
      reasonCode: "insufficient_logs",
      reason: `Only ${windowLogs.length} completed logs were found in the latest 7-night window.`,
    });
  }

  return signals;
}

function pickNoChangeSignal(signals: NoChangeSignal[]) {
  const priority: WeeklyStructuralReviewReasonCode[] = [
    "red_flags",
    "severe_daytime_impairment",
    "context_shift",
    "contradictory_data",
    "insufficient_logs",
  ];

  for (const code of priority) {
    const match = signals.find((signal) => signal.reasonCode === code);
    if (match) {
      return match;
    }
  }

  return null;
}

function buildNoChangeSummary(reason: string, effectiveDate: string) {
  return `${reason} No structural change will be made this week. The current plan stays steady starting ${effectiveDate}.`;
}

function buildDecisionSummary(
  bucket: WeeklyStructuralReviewBucket,
  metrics: WeeklyStructuralReviewDecision["metrics"],
  deltaMinutes: number,
  effectiveDate: string,
) {
  const average = `${metrics.averageEfficiency.toFixed(0)}%`;

  switch (bucket) {
    case "expand":
      return `The latest 7-night window shows stable high sleep efficiency at ${average}. The sleep window can expand by ${deltaMinutes} minutes starting ${effectiveDate}, while the wake anchor stays fixed.`;
    case "shrink":
      return `The latest 7-night window shows repeated low sleep efficiency at ${average}. The sleep window should shrink by ${Math.abs(deltaMinutes)} minutes starting ${effectiveDate}, while the wake anchor stays fixed.`;
    case "hold":
      return `The latest 7-night window is mixed and sits around ${average}. The plan should hold steady for now, with no structural change starting ${effectiveDate}.`;
  }
}

function buildDecisionEvidence(
  window: ReturnType<typeof collectStructuralWindow>,
  metrics: WeeklyStructuralReviewDecision["metrics"],
  signals: NoChangeSignal[],
) {
  const evidence = [
    `Reviewed ${window.completedLogs} completed logs from the latest ${window.totalWindowNights}-night window.`,
    `Average estimated sleep efficiency: ${metrics.averageEfficiency.toFixed(1)}%`,
    `Efficiency range: ${metrics.efficiencyRange[0].toFixed(1)}% to ${metrics.efficiencyRange[1].toFixed(1)}%`,
    `Adherence score: ${metrics.adherenceScore.toFixed(3)}`,
  ];

  if (signals.length > 0) {
    evidence.push(...signals.map((signal) => signal.reason));
  }

  return evidence;
}

export function reviewWeeklyStructure(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  context?: WeeklyStructuralReviewContext,
  now: Date = new Date(),
): WeeklyStructuralReviewDecision {
  const timeZone = planTimeZone(plan, context);
  const window = collectStructuralWindow(plan, dailyCheckIns, now);
  const contradictions = detectContradictions(window.windowLogs, plan, timeZone);
  const manualSignals = collectNoChangeSignals(window.windowLogs, contradictions, context);
  const noChangeSignal = pickNoChangeSignal(manualSignals);
  const upcomingSleepEvent = getUpcomingSleepEvent(plan, now);
  const effectiveDate =
    upcomingSleepEvent?.nightDate ?? nightDateFromIso(now.toISOString(), timeZone);

  const metrics = {
    completedLogs: window.completedLogs,
    totalWindowNights: window.totalWindowNights,
    windowStartNightDate: window.sleepEvents[0]?.nightDate ?? null,
    windowEndNightDate: window.sleepEvents[window.sleepEvents.length - 1]?.nightDate ?? null,
    averageEfficiency: 0,
    efficiencyRange: [0, 0] as [number, number],
    highEfficiencyNights: 0,
    lowEfficiencyNights: 0,
    adherenceScore: 0,
    reasonableAdherence: false,
  };

  const perNight = window.nights
    .filter((night): night is WindowNight & { log: DailySleepCheckIn } => Boolean(night.log))
    .map((night) => {
      const actual = estimateSleepEfficiency(night.log, night.event, timeZone);
      const plannedBedtime = timeValueFromIso(plannedStartIso(night.event), timeZone);
      const plannedWakeTime = timeValueFromIso(plannedEndIso(night.event), timeZone);
      const adherence =
        (clamp(1 - Math.abs(clockDifferenceMinutes(plannedBedtime, night.log.actualInBedTime)) / 120, 0, 1) +
          clamp(1 - Math.abs(clockDifferenceMinutes(plannedWakeTime, night.log.actualOutOfBedTime)) / 120, 0, 1)) /
        2;

      return {
        date: night.log.nightDate,
        efficiency: actual.efficiency,
        sleepOpportunityMinutes: actual.sleepOpportunityMinutes,
        adherence,
        bedDrift: actual.bedDriftMinutes,
        wakeDrift: actual.wakeDriftMinutes,
      };
    });

  if (perNight.length > 0) {
    const efficiencies = perNight.map((night) => night.efficiency);
    metrics.averageEfficiency =
      Math.round((efficiencies.reduce((sum, value) => sum + value, 0) / efficiencies.length) * 10) / 10;
    metrics.efficiencyRange = [
      Math.round(Math.min(...efficiencies) * 10) / 10,
      Math.round(Math.max(...efficiencies) * 10) / 10,
    ];
    metrics.highEfficiencyNights = efficiencies.filter((value) => value >= 90).length;
    metrics.lowEfficiencyNights = efficiencies.filter((value) => value < 85).length;
    metrics.adherenceScore =
      Math.round((perNight.reduce((sum, night) => sum + night.adherence, 0) / perNight.length) * 1000) /
      1000;
    metrics.reasonableAdherence =
      metrics.adherenceScore >= 0.65 &&
      perNight.filter((night) => night.bedDrift <= 45 && night.wakeDrift <= 45).length >= 3;
  }

  if (noChangeSignal) {
    const reason = noChangeSignal.reason;
    return {
      bucket: "hold",
      reasonCode: noChangeSignal.reasonCode,
      reason,
      effectiveDate,
      proposedSleepWindowDeltaMinutes: 0,
      explanatorySummary: buildNoChangeSummary(reason, effectiveDate),
      metrics,
      evidence: buildDecisionEvidence(window, metrics, manualSignals),
    };
  }

  const highStable =
    metrics.averageEfficiency >= 90 &&
    metrics.highEfficiencyNights >= 4 &&
    metrics.lowEfficiencyNights <= 1 &&
    metrics.efficiencyRange[1] - metrics.efficiencyRange[0] <= 10 &&
    metrics.reasonableAdherence;

  if (highStable) {
    const delta = 15;
    return {
      bucket: "expand",
      reasonCode: "high_stable_efficiency",
      reason:
        "Sleep efficiency is high and stable across the latest 7-night window, so the sleep window can widen by 15 minutes.",
      effectiveDate,
      proposedSleepWindowDeltaMinutes: delta,
      explanatorySummary: buildDecisionSummary("expand", metrics, delta, effectiveDate),
      metrics,
      evidence: buildDecisionEvidence(window, metrics, manualSignals),
    };
  }

  const lowRepeated =
    metrics.averageEfficiency < 85 &&
    metrics.lowEfficiencyNights >= 3 &&
    metrics.reasonableAdherence;

  if (lowRepeated) {
    const delta = -15;
    return {
      bucket: "shrink",
      reasonCode: "low_efficiency_repeated",
      reason:
        "Low sleep efficiency repeats across the latest 7-night window and adherence looks reasonable, so the sleep window should narrow by 15 minutes.",
      effectiveDate,
      proposedSleepWindowDeltaMinutes: delta,
      explanatorySummary: buildDecisionSummary("shrink", metrics, delta, effectiveDate),
      metrics,
      evidence: buildDecisionEvidence(window, metrics, manualSignals),
    };
  }

  const poorAdherenceWithLowEfficiency =
    metrics.averageEfficiency < 85 &&
    metrics.lowEfficiencyNights >= 3 &&
    !metrics.reasonableAdherence;

  const bucketReasonCode: WeeklyStructuralReviewReasonCode = poorAdherenceWithLowEfficiency
    ? "poor_adherence_for_low_efficiency"
    : "mid_range_or_mixed";

  return {
    bucket: "hold",
    reasonCode: bucketReasonCode,
    reason: poorAdherenceWithLowEfficiency
      ? "Low efficiency is present, but adherence is not steady enough for a structural shrink yet."
      : "The latest 7-night window is mixed or mid-range, so the sleep window should stay steady for now.",
    effectiveDate,
    proposedSleepWindowDeltaMinutes: 0,
    explanatorySummary: buildDecisionSummary("hold", metrics, 0, effectiveDate),
    metrics,
    evidence: buildDecisionEvidence(window, metrics, manualSignals),
  };
}

export function previewWeeklyStructuralReview(
  plan: GeneratedPlan,
  dailyCheckIns: DailySleepCheckIn[] | undefined,
  context?: WeeklyStructuralReviewContext,
  now: Date = new Date(),
): WeeklyStructuralReviewPreview {
  const decision = reviewWeeklyStructure(plan, dailyCheckIns, context, now);
  const sleepWindow = plan.events.find((event) => event.eventRole === "sleep_window");

  if (!sleepWindow) {
    throw new Error("No sleep window event found for preview");
  }

  const timeZone = planTimeZone(plan, context);
  const currentSleepWindowMinutes = clockDurationMinutes(
    timeValueFromIso(plannedStartIso(sleepWindow), timeZone),
    timeValueFromIso(plannedEndIso(sleepWindow), timeZone),
  );
  const projectedSleepWindowMinutes = currentSleepWindowMinutes + decision.proposedSleepWindowDeltaMinutes;
  const currentBedtimeTarget = formatClockLabel(
    timeValueFromIso(plannedStartIso(sleepWindow), timeZone),
  );
  const currentWakeAnchor = formatClockLabel(timeValueFromIso(plannedEndIso(sleepWindow), timeZone));
  const projectedBedtimeTarget = formatClockLabel(
    formatClockMinutes(
      parseClockMinutes(timeValueFromIso(plannedStartIso(sleepWindow), timeZone)) -
        decision.proposedSleepWindowDeltaMinutes,
    ),
  );

  return {
    decision,
    currentSleepWindowMinutes,
    projectedSleepWindowMinutes,
    currentBedtimeTarget,
    projectedBedtimeTarget,
    currentWakeAnchor,
    projectedWakeAnchor: currentWakeAnchor,
    wakeAnchorFixed: true,
  };
}
