import { addMinutes } from "date-fns";

import { buildReportPlanView } from "@/lib/report-plan";
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

describe("report plan view", () => {
  it("keeps the current plan compact and user-facing", () => {
    const { plan, sleepEvents } = buildFixture();
    const reportView = buildReportPlanView(plan, [], nowAfter(sleepEvents[6]));

    expect(reportView.currentPlan).toEqual({
      wakeTime: plan.wakeTime,
      bedtimeTarget: plan.bedtimeTarget,
      sleepWindow: plan.sleepWindow,
      weekArc: plan.weekSummaries.map(({ weekNumber, title, focus }) => ({
        weekNumber,
        title,
        focus,
      })),
    });
    expect(reportView.changeSummary).toEqual([]);
  });

  it("surfaces a single plain-language change when structure actually changes", () => {
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

    const reportView = buildReportPlanView(plan, logs, nowAfter(sleepEvents[6]));

    expect(reportView.changeSummary).toHaveLength(1);
    expect(reportView.changeSummary[0]).toMatchObject({
      title: "Sleep window expands by 15 minutes",
      deltaMinutes: 15,
      why: expect.stringContaining("Sleep efficiency is high and stable"),
      effectiveDate: expect.any(String),
    });
  });

  it("suppresses internal adjustment chatter when the plan should hold", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const logs = sleepEvents.slice(0, 5).map((event) =>
      entryFor(event, timezone, {
        nightPattern: "fell_asleep_quickly",
        sleepLatencyBucket: "under_20",
        awakeDuringNightBucket: "under_20",
        awakeningsBucket: "1",
        morningFunction: "tired_but_manageable",
      }),
    );

    logs[0] = entryFor(sleepEvents[0], timezone, {
      nightPattern: "slow_sleep",
      sleepLatencyBucket: "20_40",
      awakeDuringNightBucket: "20_40",
      awakeningsBucket: "2",
      morningFunction: "tired_but_manageable",
    });

    logs[1] = entryFor(sleepEvents[1], timezone, {
      nightPattern: "slow_sleep",
      sleepLatencyBucket: "20_40",
      awakeDuringNightBucket: "20_40",
      awakeningsBucket: "2",
      morningFunction: "tired_but_manageable",
    });

    const reportView = buildReportPlanView(plan, logs, nowAfter(sleepEvents[6]));

    expect(reportView.changeSummary).toEqual([]);
  });

  it("does not expose a change summary for one bad night alone", () => {
    const { plan, timezone, sleepEvents } = buildFixture();
    const reportView = buildReportPlanView(
      plan,
      [
        entryFor(sleepEvents[0], timezone, {
          closenessToPlan: "bedtime_later",
          actualInBedTime: "02:40",
          nightPattern: "slow_sleep",
          sleepLatencyBucket: "40_60",
          morningFunction: "running_on_fumes",
          derivedTitleTags: ["late start"],
        }),
      ],
      nowAfter(sleepEvents[0]),
    );

    expect(reportView.changeSummary).toEqual([]);
    expect(reportView.currentPlan.wakeTime).toBe(plan.wakeTime);
    expect(nowAfter(sleepEvents[0])).toBeInstanceOf(Date);
  });
});
