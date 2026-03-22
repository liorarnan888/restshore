import { addMinutes } from "date-fns";

import { reviewWeeklyStructure, previewWeeklyStructuralReview } from "@/lib/structural-adaptation";
import { timeValueFromIso } from "@/lib/daily-checkin";
import { buildGeneratedPlan, buildSleepProfile } from "@/lib/plan-engine";
import type { DailySleepCheckIn, ProgramEvent } from "@/lib/types";

const baseAnswers = {
  primary_problem: "falling_asleep",
  insomnia_duration: "over_1_year",
  daytime_impact: "high",
  desired_wake_time: "09:00",
  usual_bedtime: "01:30",
  weekend_wake_shift: "1_2_hours",
  time_in_bed: "8_9",
  sleep_latency: "30_60",
  wake_after_sleep_onset: "30_60",
  awakenings_count: "2_3",
  early_wake_pattern: "1_2",
  schedule_consistency: "swings",
  bed_use_pattern: "phone_or_tv",
  awake_response: "stay_and_try",
  caffeine_amount: "moderate",
  caffeine_timing: "late_afternoon",
  alcohol_timing: "some_evenings",
  dinner_timing: "under_2_hours",
  screen_habit: "in_bed",
  work_after_dinner: "often",
  naps: "sometimes",
  exercise_timing: "afternoon",
  stress_level: "busy",
  sleep_thoughts: "pressure",
  relaxation_experience: "inconsistent",
  sleep_medication: "none",
  sleep_environment: "noise",
  impact_areas: ["work"],
  red_flags: ["none"],
  motivation: "steady",
} as const;

function plannedStartIso(event: ProgramEvent) {
  return event.plannedStartsAt ?? event.startsAt;
}

function plannedEndIso(event: ProgramEvent) {
  return event.plannedEndsAt ?? event.endsAt;
}

function buildFixture() {
  const profile = buildSleepProfile(baseAnswers, "Asia/Bangkok");
  const plan = buildGeneratedPlan(profile);
  const sleepEvents = plan.events
    .filter((event) => event.eventRole === "sleep_window" && event.nightDate)
    .sort((left, right) => plannedStartIso(left).localeCompare(plannedStartIso(right)));

  return {
    plan,
    timezone: profile.timezone,
    sleepEvents,
  };
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
    submittedAt: "2026-03-18T01:00:00.000Z",
    updatedAt: "2026-03-18T01:00:00.000Z",
    ...overrides,
  };
}

function nowAfter(event: ProgramEvent) {
  return addMinutes(new Date(plannedEndIso(event)), 60);
}

describe("weekly structural review", () => {
  it("expands the sleep window when the latest week is stable and efficient", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        closenessToPlan: "close_to_plan",
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
        morningFunction: "good_enough",
      }),
    );

    const decision = reviewWeeklyStructure(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(decision.bucket).toBe("expand");
    expect(decision.reasonCode).toBe("high_stable_efficiency");
    expect(decision.proposedSleepWindowDeltaMinutes).toBe(15);
    expect(decision.effectiveDate).toBe(sleepEvents[7]?.nightDate);
    expect(decision.reason).toContain("stable");
    expect(decision.explanatorySummary).toContain("expand by 15 minutes");
    expect(decision.metrics.completedLogs).toBe(5);
    expect(decision.metrics.reasonableAdherence).toBe(true);
  });

  it("holds steady when the latest week is mixed or mid-range", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = [
      entryFor(sleepEvents[0], timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
      entryFor(sleepEvents[1], timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "20_40",
        awakeDuringNightBucket: "20_40",
        awakeningsBucket: "2",
      }),
      entryFor(sleepEvents[2], timezone, {
        nightPattern: "slow_sleep",
        sleepLatencyBucket: "40_60",
        awakeDuringNightBucket: "20_40",
        awakeningsBucket: "2",
      }),
      entryFor(sleepEvents[3], timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "20_40",
        awakeDuringNightBucket: "20_40",
        awakeningsBucket: "2",
      }),
      entryFor(sleepEvents[4], timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "20_40",
        awakeDuringNightBucket: "20_40",
        awakeningsBucket: "2",
      }),
    ];

    const decision = reviewWeeklyStructure(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("mid_range_or_mixed");
    expect(decision.proposedSleepWindowDeltaMinutes).toBe(0);
    expect(decision.reason).toContain("mixed or mid-range");
    expect(decision.explanatorySummary).toContain("hold steady");
  });

  it("shrinks the sleep window when low efficiency repeats with reasonable adherence", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "slow_sleep",
        sleepLatencyBucket: "over_60",
        awakeDuringNightBucket: "over_60",
        awakeningsBucket: "5_plus",
        morningFunction: "tired_but_manageable",
      }),
    );

    const decision = reviewWeeklyStructure(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(decision.bucket).toBe("shrink");
    expect(decision.reasonCode).toBe("low_efficiency_repeated");
    expect(decision.proposedSleepWindowDeltaMinutes).toBe(-15);
    expect(decision.reason).toMatch(/low sleep efficiency repeats/i);
    expect(decision.metrics.lowEfficiencyNights).toBeGreaterThanOrEqual(3);
    expect(decision.metrics.reasonableAdherence).toBe(true);
  });

  it("holds steady when fewer than 5 logs are present", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 4).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    const decision = reviewWeeklyStructure(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("insufficient_logs");
    expect(decision.proposedSleepWindowDeltaMinutes).toBe(0);
    expect(decision.reason).toContain("Only 4 completed logs");
  });

  it("holds steady for contradictory diary data", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    logs[0] = {
      ...logs[0],
      closenessToPlan: "close_to_plan",
      actualInBedTime: "05:00",
      actualOutOfBedTime: "05:30",
    };

    const decision = reviewWeeklyStructure(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("contradictory_data");
    expect(decision.evidence.join(" ")).toContain("contradictory entries");
  });

  it("holds steady when red flags are present", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    const decision = reviewWeeklyStructure(
      plan,
      logs,
      {
        redFlags: ["suspected_sleep_apnea"],
      },
      nowAfter(sleepEvents[6]),
    );

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("red_flags");
    expect(decision.reason).toContain("Red flags");
  });

  it("holds steady when the context shifts materially", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    const decision = reviewWeeklyStructure(
      plan,
      logs,
      {
        contextShiftFlags: ["travel", "timezone_change"],
      },
      nowAfter(sleepEvents[6]),
    );

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("context_shift");
    expect(decision.reason).toContain("Context shift");
  });

  it("holds steady when severe daytime impairment is flagged", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    const decision = reviewWeeklyStructure(
      plan,
      logs,
      {
        severeDaytimeImpairment: true,
      },
      nowAfter(sleepEvents[6]),
    );

    expect(decision.bucket).toBe("hold");
    expect(decision.reasonCode).toBe("severe_daytime_impairment");
  });

  it("keeps the wake anchor fixed in the preview while changing only the sleep window length", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
      }),
    );

    const preview = previewWeeklyStructuralReview(plan, logs, undefined, nowAfter(sleepEvents[6]));

    expect(preview.decision.bucket).toBe("expand");
    expect(preview.wakeAnchorFixed).toBe(true);
    expect(preview.projectedWakeAnchor).toBe(preview.currentWakeAnchor);
    expect(preview.projectedSleepWindowMinutes).toBe(
      preview.currentSleepWindowMinutes + 15,
    );
    expect(preview.projectedBedtimeTarget).not.toBe(preview.currentBedtimeTarget);
  });
});
