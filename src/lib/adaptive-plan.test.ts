import { addMinutes } from "date-fns";

import {
  adaptPlanFromDailyCheckIns,
  previewAdaptiveScenario,
} from "@/lib/adaptive-plan";
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

function changedEvents(plan: ReturnType<typeof buildGeneratedPlan>, changedIds: string[]) {
  return plan.events.filter((event) => changedIds.includes(event.id));
}

describe("adaptive plan", () => {
  it("does not change future guidance with no logs", () => {
    const { plan, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(plan, [], nowAfter(sleepEvents[0] as ProgramEvent));

    expect(adapted.summary).toHaveLength(0);
    expect(adapted.changedEventIds).toHaveLength(0);
    expect(adapted.plan).toBe(plan);
  });

  it("does not change future guidance after one bad night alone", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:40",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
      ],
      nowAfter(sleepEvents[0] as ProgramEvent),
    );

    expect(adapted.summary).toHaveLength(0);
    expect(adapted.changedEventIds).toHaveLength(0);
    expect(adapted.plan).toBe(plan);
  });

  it("triggers only late-start adjustments when 2 of the last 3 nights drift later", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:35",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:20",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(["late-start"]);
    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(changed.length).toBeGreaterThan(0);
    expect(
      changed.every(
        (event) =>
          event.eventType === "screen" ||
          event.eventType === "winddown" ||
          event.eventRole === "sleep_window",
      ),
    ).toBe(true);
  });

  it("triggers only sleep-onset adjustments when slow sleep repeats", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          nightPattern: "rough_mix",
          sleepLatencyBucket: "over_60",
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(["sleep-onset"]);
    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(
      changed.every(
        (event) => event.eventRole === "in_bed_practice" || event.eventType === "winddown",
      ),
    ).toBe(true);
  });

  it("triggers only fragmentation adjustments when repeated wake time shows up", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          nightPattern: "several_wakeups",
          awakeDuringNightBucket: "40_60",
          awakeningsBucket: "3_4",
          derivedTitleTags: ["4 awakenings"],
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          nightPattern: "rough_mix",
          awakeDuringNightBucket: "over_60",
          awakeningsBucket: "5_plus",
          derivedTitleTags: ["many awakenings", "long awake time"],
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(["overnight-reset"]);
    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(
      changed.every(
        (event) =>
          event.eventRole === "sleep_window" ||
          event.eventRole === "in_bed_practice" ||
          event.eventType === "mindset",
      ),
    ).toBe(true);
  });

  it("triggers only early-wake adjustments when repeated early endings show up", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          closenessToPlan: "wake_drifted",
          nightPattern: "early_wake",
          earlyWakeBucket: "60_90",
          actualOutOfBedTime: "07:45",
          derivedTitleTags: ["early wake"],
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          closenessToPlan: "wake_drifted",
          nightPattern: "early_wake",
          earlyWakeBucket: "over_90",
          actualOutOfBedTime: "07:10",
          derivedTitleTags: ["early wake"],
          morningFunction: "tired_but_manageable",
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(["early-wake"]);
    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(
      changed.every(
        (event) =>
          event.eventType === "wake" ||
          event.eventType === "light" ||
          event.eventRole === "sleep_window",
      ),
    ).toBe(true);
  });

  it("triggers only fatigue adjustments when heavy mornings repeat", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          morningFunction: "running_on_fumes",
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          morningFunction: "running_on_fumes",
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(["fatigue"]);
    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(
      changed.every(
        (event) =>
          event.eventType === "nap" ||
          event.eventType === "exercise" ||
          event.eventType === "light" ||
          event.eventType === "wake",
      ),
    ).toBe(true);
  });

  it("triggers multiple rule families together when the pattern really overlaps", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:35",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:25",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "over_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(
      expect.arrayContaining(["late-start", "sleep-onset", "fatigue"]),
    );
  });

  it("looks only at the latest 3 nights when deciding whether to change the future", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[3] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:30",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {}),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {}),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:15",
          derivedTitleTags: ["late start"],
        }),
      ],
      nowAfter(sleepEvents[3] as ProgramEvent),
    );

    expect(adapted.summary).toHaveLength(0);
    expect(adapted.changedEventIds).toHaveLength(0);
  });

  it("never edits daily check-in events as part of future guidance changes", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:35",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:20",
          derivedTitleTags: ["late start"],
        }),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    const changed = changedEvents(plan, adapted.changedEventIds);
    expect(changed.some((event) => event.eventRole === "daily_checkin")).toBe(false);
    expect(changed.some((event) => event.id.includes("checkin-daily-log"))).toBe(false);
  });

  it("caps changes to at most 3 future events per event family", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          morningFunction: "running_on_fumes",
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          morningFunction: "running_on_fumes",
        }),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    const counts = changedEvents(plan, adapted.changedEventIds).reduce<Record<string, number>>(
      (accumulator, event) => {
        const key = event.eventRole ?? event.eventType;
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      {},
    );

    expect(Object.values(counts).every((count) => count <= 3)).toBe(true);
  });

  it("supports combined patterns without losing rule specificity", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const preview = previewAdaptiveScenario(plan, "double_late_start_sleep_onset");

    expect(preview.shouldAdjustFuturePlan).toBe(true);
    expect(preview.triggeredRules.map((item) => item.id)).toEqual(
      expect.arrayContaining(["late-start", "sleep-onset"]),
    );
    expect(preview.changedEvents.length).toBeGreaterThan(0);
    expect(
      preview.changedEvents.some((event) => event.descriptionAfter.includes("Adaptive focus")),
    ).toBe(true);

    const adapted = adaptPlanFromDailyCheckIns(
      plan,
      [
        entryFor(sleepEvents[2] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:35",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[1] as ProgramEvent, timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:25",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "over_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
        entryFor(sleepEvents[0] as ProgramEvent, timezone, {}),
      ],
      nowAfter(sleepEvents[2] as ProgramEvent),
    );

    expect(adapted.summary.map((item) => item.id)).toEqual(
      expect.arrayContaining(["late-start", "sleep-onset", "fatigue"]),
    );
  });

  it.each([
    ["single_bad_night", false, []],
    ["double_late_start", true, ["late-start"]],
    ["double_sleep_onset", true, ["sleep-onset"]],
    ["double_fragmented", true, ["overnight-reset"]],
    ["double_early_wake", true, ["early-wake"]],
    ["double_fatigue", true, ["fatigue"]],
  ] as const)(
    "exposes the expected preview output for %s",
    (scenario, shouldAdjustFuturePlan, expectedRuleIds) => {
      const { plan } = buildFixture();
      const preview = previewAdaptiveScenario(plan, scenario);

      expect(preview.shouldAdjustFuturePlan).toBe(shouldAdjustFuturePlan);
      expect(preview.triggeredRules.map((item) => item.id)).toEqual(expectedRuleIds);
      expect(preview.simulatedLogs.length).toBe(scenario === "single_bad_night" ? 1 : 2);
      if (shouldAdjustFuturePlan) {
        expect(preview.changedEvents.length).toBeGreaterThan(0);
      }
    },
  );

  it("shows exact simulated logs and before-after diffs in adaptation preview", () => {
    const { plan } = buildFixture();
    const preview = previewAdaptiveScenario(plan, "double_fragmented");

    expect(preview.simulatedLogs).toHaveLength(2);
    expect(preview.simulatedLogs[0]?.responses.some((item) => item.label === "Awakenings")).toBe(
      true,
    );
    expect(preview.triggeredRules).toHaveLength(1);
    expect(preview.triggeredRules[0]?.id).toBe("overnight-reset");
    expect(preview.triggeredRules[0]?.evidence).toContain("2 of the last 2 logs");
    expect(preview.summary[0]?.id).toBe("overnight-reset");
    expect(preview.changedEvents.length).toBeGreaterThan(0);
    expect(preview.changedEvents[0]?.descriptionBefore).not.toBe(
      preview.changedEvents[0]?.descriptionAfter,
    );
  });

  it("uses combined scenario presets for fragmentation and fatigue", () => {
    const { plan } = buildFixture();
    const preview = previewAdaptiveScenario(plan, "double_fragmented_fatigue");

    expect(preview.triggeredRules.map((item) => item.id)).toEqual(
      expect.arrayContaining(["overnight-reset", "fatigue"]),
    );
    expect(preview.shouldAdjustFuturePlan).toBe(true);
  });
});
