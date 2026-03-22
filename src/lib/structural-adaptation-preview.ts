import { addMinutes, format, set } from "date-fns";

import {
  previewWeeklyStructuralReview,
  type WeeklyStructuralReviewContext,
} from "@/lib/structural-adaptation";
import { timeValueFromIso } from "@/lib/daily-checkin";
import type { DailySleepCheckIn, GeneratedPlan, ProgramEvent } from "@/lib/types";

export type StructuralPreviewScenario =
  | "stable_expand"
  | "mixed_hold"
  | "low_efficiency_shrink"
  | "insufficient_logs"
  | "contradictory_data"
  | "red_flags"
  | "context_shift"
  | "severe_impairment";

export type StructuralPreviewResponse = {
  scenario: StructuralPreviewScenario;
  scenarioLabel: string;
  reviewWindow: Array<{
    nightDate: string;
    nightLabel: string;
    status: "logged" | "missing";
    note: string;
  }>;
  simulatedLogs: Array<{
    nightDate: string;
    nightLabel: string;
    summary: string;
    responses: Array<{
      label: string;
      value: string;
    }>;
  }>;
  decision: {
    bucket: "expand" | "hold" | "shrink";
    reasonCode: string;
    reason: string;
    explanatorySummary: string;
    effectiveDate: string;
  };
  policyTrace: Array<{
    label: string;
    value: string;
  }>;
  planBeforeAfter: Array<{
    label: string;
    before: string;
    after: string;
    note: string;
    changed: boolean;
  }>;
  nextSchedulePreview: Array<{
    label: string;
    before: string;
    after: string;
    note: string;
    changed: boolean;
  }>;
};

type ScenarioConfig = {
  label: string;
  context?: WeeklyStructuralReviewContext;
  entries: Array<DailySleepCheckIn | null>;
};

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

function nightDateLabel(nightDate: string) {
  const [year, month, day] = nightDate.split("-").map(Number);
  return format(new Date(year, (month ?? 1) - 1, day ?? 1), "EEEE, MMMM d");
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

function formatMinutesLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${minutes}m`;
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

function shiftClock(value: string, deltaMinutes: number) {
  return formatClockLabel(formatClockMinutes(parseClockMinutes(value) + deltaMinutes));
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
      return "1 awakening";
    case "2":
      return "2 awakenings";
    case "3_4":
      return "3 to 4 awakenings";
    case "5_plus":
      return "5 or more awakenings";
    default:
      return null;
  }
}

function earlyWakeLabel(value?: DailySleepCheckIn["earlyWakeBucket"]) {
  switch (value) {
    case "under_30":
      return "Under 30 minutes early";
    case "30_60":
      return "30 to 60 minutes early";
    case "60_90":
      return "60 to 90 minutes early";
    case "over_90":
      return "More than 90 minutes early";
    default:
      return null;
  }
}

function entryFor(
  event: ProgramEvent,
  timezone: string,
  overrides: Partial<DailySleepCheckIn>,
): DailySleepCheckIn {
  return {
    nightDate: event.nightDate as string,
    sleepEventId: event.id,
    checkInEventId: `${event.nightDate}-checkin-daily-log`,
    closenessToPlan: "close_to_plan",
    actualInBedTime: timeValueFromIso(plannedStartIso(event), timezone),
    actualOutOfBedTime: timeValueFromIso(plannedEndIso(event), timezone),
    nightPattern: "fell_asleep_quickly",
    morningFunction: "good_enough",
    derivedTitleTags: [],
    submittedAt: "2026-03-19T00:00:00.000Z",
    updatedAt: "2026-03-19T00:00:00.000Z",
    ...overrides,
  };
}

function buildScenarioConfig(plan: GeneratedPlan, scenario: StructuralPreviewScenario): ScenarioConfig {
  const sleepEvents = plan.events
    .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
    .sort((left, right) => plannedStartIso(left).localeCompare(plannedStartIso(right)))
    .slice(0, 7);

  if (sleepEvents.length < 7) {
    throw new Error("Not enough sleep-window nights to preview weekly structural review.");
  }

  const zone = plan.timezone;

  switch (scenario) {
    case "stable_expand":
      return {
        label: "Stable week -> expand",
        entries: sleepEvents.map((event) =>
          entryFor(event, zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
            morningFunction: "good_enough",
          }),
        ),
      };
    case "mixed_hold":
      return {
        label: "Mixed week -> hold",
        entries: [
          entryFor(sleepEvents[0], zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
          entryFor(sleepEvents[1], zone, {
            sleepLatencyBucket: "20_40",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
            morningFunction: "tired_but_manageable",
          }),
          entryFor(sleepEvents[2], zone, {
            nightPattern: "slow_sleep",
            sleepLatencyBucket: "40_60",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
            morningFunction: "tired_but_manageable",
          }),
          entryFor(sleepEvents[3], zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
          }),
          entryFor(sleepEvents[4], zone, {
            sleepLatencyBucket: "20_40",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
          }),
          entryFor(sleepEvents[5], zone, {
            nightPattern: "rough_mix",
            sleepLatencyBucket: "20_40",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
            morningFunction: "tired_but_manageable",
          }),
          entryFor(sleepEvents[6], zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
        ],
      };
    case "low_efficiency_shrink":
      return {
        label: "Repeated low efficiency -> shrink",
        entries: sleepEvents.map((event) =>
          entryFor(event, zone, {
            nightPattern: "slow_sleep",
            sleepLatencyBucket: "over_60",
            awakeDuringNightBucket: "over_60",
            awakeningsBucket: "5_plus",
            morningFunction: "tired_but_manageable",
          }),
        ),
      };
    case "insufficient_logs":
      return {
        label: "Sparse week -> hold steady",
        entries: [
          entryFor(sleepEvents[0], zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
          entryFor(sleepEvents[1], zone, {
            sleepLatencyBucket: "20_40",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
          }),
          null,
          entryFor(sleepEvents[3], zone, {
            sleepLatencyBucket: "20_40",
            awakeDuringNightBucket: "20_40",
            awakeningsBucket: "2",
          }),
          null,
          entryFor(sleepEvents[5], zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
          null,
        ],
      };
    case "contradictory_data":
      return {
        label: "Contradictory diary -> hold steady",
        entries: [
          entryFor(sleepEvents[0], zone, {
            closenessToPlan: "close_to_plan",
            actualInBedTime: "05:00",
            actualOutOfBedTime: "05:30",
          }),
          ...sleepEvents.slice(1).map((event) =>
            entryFor(event, zone, {
              sleepLatencyBucket: "under_20",
              awakeDuringNightBucket: "under_20",
              awakeningsBucket: "1",
            }),
          ),
        ],
      };
    case "red_flags":
      return {
        label: "Red flag present -> hold steady",
        context: {
          redFlags: ["suspected_sleep_apnea"],
        },
        entries: sleepEvents.map((event) =>
          entryFor(event, zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
        ),
      };
    case "context_shift":
      return {
        label: "Context shift -> hold steady",
        context: {
          contextShiftFlags: ["travel", "schedule_change"],
        },
        entries: sleepEvents.map((event) =>
          entryFor(event, zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
          }),
        ),
      };
    case "severe_impairment":
      return {
        label: "Severe daytime impairment -> hold steady",
        context: {
          severeDaytimeImpairment: true,
        },
        entries: sleepEvents.map((event) =>
          entryFor(event, zone, {
            sleepLatencyBucket: "under_20",
            awakeDuringNightBucket: "under_20",
            awakeningsBucket: "1",
            morningFunction: "running_on_fumes",
          }),
        ),
      };
  }
}

function buildReviewWindow(
  sleepEvents: ProgramEvent[],
  entries: Array<DailySleepCheckIn | null>,
) {
  return sleepEvents.map((event, index) => {
    const entry = entries[index];

    return {
      nightDate: event.nightDate as string,
      nightLabel: nightDateLabel(event.nightDate as string),
      status: entry ? ("logged" as const) : ("missing" as const),
      note: entry
        ? `${patternLabel(entry.nightPattern)}. ${morningFunctionLabel(entry.morningFunction)}.`
        : "No check-in submitted for this night.",
    };
  });
}

function buildSimulatedLogs(entries: Array<DailySleepCheckIn | null>) {
  return entries
    .filter((entry): entry is DailySleepCheckIn => Boolean(entry))
    .map((entry) => {
      const details = [
        {
          label: "How close was the night to the plan?",
          value: closenessLabel(entry.closenessToPlan),
        },
        {
          label: "Actual bedtime",
          value: entry.actualInBedTime,
        },
        {
          label: "Actual wake time",
          value: entry.actualOutOfBedTime,
        },
        {
          label: "Night pattern",
          value: patternLabel(entry.nightPattern),
        },
        {
          label: "Morning state",
          value: morningFunctionLabel(entry.morningFunction),
        },
      ];

      const optionalResponses = [
        latencyLabel(entry.sleepLatencyBucket)
          ? {
              label: "Sleep latency",
              value: latencyLabel(entry.sleepLatencyBucket) as string,
            }
          : null,
        awakeDuringNightLabel(entry.awakeDuringNightBucket)
          ? {
              label: "Time awake during the night",
              value: awakeDuringNightLabel(entry.awakeDuringNightBucket) as string,
            }
          : null,
        awakeningsLabel(entry.awakeningsBucket)
          ? {
              label: "Awakenings",
              value: awakeningsLabel(entry.awakeningsBucket) as string,
            }
          : null,
        earlyWakeLabel(entry.earlyWakeBucket)
          ? {
              label: "Early wake",
              value: earlyWakeLabel(entry.earlyWakeBucket) as string,
            }
          : null,
      ].filter(Boolean) as Array<{ label: string; value: string }>;

      return {
        nightDate: entry.nightDate,
        nightLabel: nightDateLabel(entry.nightDate),
        summary: `${closenessLabel(entry.closenessToPlan)}. ${patternLabel(entry.nightPattern)}. ${morningFunctionLabel(entry.morningFunction)}.`,
        responses: [...details, ...optionalResponses],
      };
    });
}

export function previewStructuralScenario(
  plan: GeneratedPlan,
  scenario: StructuralPreviewScenario,
): StructuralPreviewResponse {
  const sleepEvents = plan.events
    .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
    .sort((left, right) => plannedStartIso(left).localeCompare(plannedStartIso(right)))
    .slice(0, 8);

  if (sleepEvents.length < 8) {
    throw new Error("Not enough sleep nights in the plan to preview structural adaptation.");
  }

  const config = buildScenarioConfig(plan, scenario);
  const entries = config.entries;
  const completedLogs = entries.filter((entry): entry is DailySleepCheckIn => Boolean(entry));
  const now = addMinutes(new Date(plannedEndIso(sleepEvents[6])), 60);
  const preview = previewWeeklyStructuralReview(plan, completedLogs, config.context, now);
  const planShiftMinutes = -preview.decision.proposedSleepWindowDeltaMinutes;
  const formattedEffectiveDate = nightDateLabel(preview.decision.effectiveDate);

  return {
    scenario,
    scenarioLabel: config.label,
    reviewWindow: buildReviewWindow(sleepEvents.slice(0, 7), entries),
    simulatedLogs: buildSimulatedLogs(entries),
    decision: {
      bucket: preview.decision.bucket,
      reasonCode: preview.decision.reasonCode,
      reason: preview.decision.reason,
      explanatorySummary: preview.decision.explanatorySummary,
      effectiveDate: formattedEffectiveDate,
    },
    policyTrace: [
      {
        label: "Review window",
        value:
          preview.decision.metrics.windowStartNightDate && preview.decision.metrics.windowEndNightDate
            ? `${nightDateLabel(preview.decision.metrics.windowStartNightDate)} to ${nightDateLabel(preview.decision.metrics.windowEndNightDate)}`
            : "Not enough completed nights in the review window",
      },
      {
        label: "Completed logs",
        value: `${preview.decision.metrics.completedLogs} of ${preview.decision.metrics.totalWindowNights}`,
      },
      {
        label: "Average estimated sleep efficiency",
        value: `${preview.decision.metrics.averageEfficiency.toFixed(1)}%`,
      },
      {
        label: "Adherence",
        value: `${preview.decision.metrics.adherenceScore.toFixed(3)} (${preview.decision.metrics.reasonableAdherence ? "reasonable" : "not steady enough"})`,
      },
      {
        label: "Decision",
        value: preview.decision.bucket.replace("_", " "),
      },
      {
        label: "Effective night",
        value: formattedEffectiveDate,
      },
    ],
    planBeforeAfter: [
      {
        label: "Sleep window",
        before: formatMinutesLabel(preview.currentSleepWindowMinutes),
        after: formatMinutesLabel(preview.projectedSleepWindowMinutes),
        note:
          preview.decision.proposedSleepWindowDeltaMinutes === 0
            ? "No structural change this week."
            : `${preview.decision.proposedSleepWindowDeltaMinutes > 0 ? "+" : ""}${preview.decision.proposedSleepWindowDeltaMinutes} minutes`,
        changed: preview.currentSleepWindowMinutes !== preview.projectedSleepWindowMinutes,
      },
      {
        label: "Bedtime target",
        before: preview.currentBedtimeTarget,
        after: preview.projectedBedtimeTarget,
        note:
          preview.currentBedtimeTarget === preview.projectedBedtimeTarget
            ? "No automatic bedtime move."
            : "Moves with the structural sleep-window decision.",
        changed: preview.currentBedtimeTarget !== preview.projectedBedtimeTarget,
      },
      {
        label: "Wake anchor",
        before: preview.currentWakeAnchor,
        after: preview.projectedWakeAnchor,
        note: "This stays fixed automatically.",
        changed: false,
      },
    ],
    nextSchedulePreview: [
      {
        label: "Digital sunset",
        before: formatClockLabel(plan.screenCutoff),
        after: shiftClock(plan.screenCutoff, planShiftMinutes),
        note:
          planShiftMinutes === 0
            ? "No change."
            : "Shifts with the evening runway for the new bedtime target.",
        changed: planShiftMinutes !== 0,
      },
      {
        label: "Wind-down start",
        before: formatClockLabel(plan.windDownStart),
        after: shiftClock(plan.windDownStart, planShiftMinutes),
        note:
          planShiftMinutes === 0
            ? "No change."
            : "Shifts with bedtime so the downshift still starts on time.",
        changed: planShiftMinutes !== 0,
      },
      {
        label: "Sleep window starts",
        before: preview.currentBedtimeTarget,
        after: preview.projectedBedtimeTarget,
        note:
          planShiftMinutes === 0
            ? "No change."
            : "This is the main structural bedtime change.",
        changed: planShiftMinutes !== 0,
      },
      {
        label: "Wake-up anchor",
        before: preview.currentWakeAnchor,
        after: preview.projectedWakeAnchor,
        note: "Always stays fixed in automatic weekly reviews.",
        changed: false,
      },
      {
        label: "Morning light",
        before: formatClockLabel(plan.lightWindow),
        after: formatClockLabel(plan.lightWindow),
        note: "Stays tied to the wake anchor, so it does not move here.",
        changed: false,
      },
    ],
  };
}
