import {
  buildGeneratedPlan,
  buildSleepProfile,
  datePartsToUtcInstant,
} from "@/lib/plan-engine";

function formatTimeInZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

describe("plan engine", () => {
  it("converts wall-clock times in the user timezone to the correct UTC instant", () => {
    const instant = datePartsToUtcInstant(
      { year: 2026, month: 3, day: 23 },
      { hours: 7, minutes: 0 },
      "Asia/Bangkok",
    );

    expect(instant.toISOString()).toBe("2026-03-23T00:00:00.000Z");
  });

  it("creates a 6-week program with rich event coverage", () => {
    const profile = buildSleepProfile(
      {
        primary_problem: "falling_asleep",
        insomnia_duration: "over_1_year",
        daytime_impact: "severe",
        desired_wake_time: "07:00",
        usual_bedtime: "23:30",
        weekend_wake_shift: "over_2_hours",
        time_in_bed: "8_9",
        sleep_latency: "over_60",
        wake_after_sleep_onset: "30_60",
        awakenings_count: "2_3",
        early_wake_pattern: "3_4",
        schedule_consistency: "swings",
        bed_use_pattern: "phone_or_tv",
        awake_response: "stay_and_try",
        caffeine_amount: "high",
        caffeine_timing: "evening",
        alcohol_timing: "some_evenings",
        dinner_timing: "under_2_hours",
        screen_habit: "in_bed",
        work_after_dinner: "often",
        naps: "frequent_short",
        exercise_timing: "afternoon",
        stress_level: "racing",
        sleep_thoughts: "pressure",
        relaxation_experience: "inconsistent",
        sleep_medication: "none",
        sleep_environment: "noise",
        impact_areas: ["work", "mood"],
        red_flags: ["none"],
        motivation: "steady",
      },
      "Asia/Bangkok",
    );

    const plan = buildGeneratedPlan(profile);

    expect(plan.durationWeeks).toBe(6);
    expect(plan.events.length).toBeGreaterThan(300);
    expect(plan.weekSummaries).toHaveLength(6);
    expect(plan.mealCutoff).toBeTruthy();
    expect(plan.sleepWindow).toBeTruthy();
    expect(
      formatTimeInZone(
        new Date(
          plan.events.find((event) => event.eventType === "wake")!.startsAt,
        ),
        "Asia/Bangkok",
      ),
    ).toBe(profile.desiredWakeTime);
    expect(
      plan.events.some((event) => event.eventRole === "daily_checkin"),
    ).toBe(true);
    const firstCheckIn = plan.events.find((event) => event.eventRole === "daily_checkin");
    const matchingSleepWindow = plan.events.find(
      (event) =>
        event.eventRole === "sleep_window" &&
        event.nightDate === firstCheckIn?.nightDate,
    );

    expect(firstCheckIn).toBeDefined();
    expect(matchingSleepWindow).toBeDefined();
    expect(
      new Date(firstCheckIn!.startsAt).getTime() -
        new Date(matchingSleepWindow!.endsAt).getTime(),
    ).toBe(5 * 60 * 60 * 1000);
    expect(
      plan.events.some((event) => event.eventRole === "sleep_window" && event.nightDate),
    ).toBe(true);
    expect(plan.insightTags).toEqual(
      expect.arrayContaining([
        "late_caffeine",
        "late_stimulation",
        "high_arousal",
      ]),
    );
  });
});
