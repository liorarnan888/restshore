import { deriveInsightTags, getVisibleFlowSteps } from "@/lib/questionnaire";

describe("questionnaire", () => {
  it("derives richer insight tags from answers", () => {
    const tags = deriveInsightTags({
      daytime_impact: "severe",
      caffeine_amount: "high",
      caffeine_timing: "evening",
      screen_habit: "in_bed",
      work_after_dinner: "almost_always",
      schedule_consistency: "very_irregular",
      weekend_wake_shift: "over_2_hours",
      stress_level: "racing",
      sleep_thoughts: "catastrophic",
      sleep_latency: "over_60",
      wake_after_sleep_onset: "30_60",
      bed_use_pattern: "worrying",
      awake_response: "stay_and_try",
      impact_areas: ["work"],
    });

    expect(tags).toEqual(
      expect.arrayContaining([
        "late_caffeine",
        "late_stimulation",
        "irregular_schedule",
        "high_arousal",
        "long_awake",
        "bed_association",
        "daytime_fatigue",
        "severe_insomnia",
      ]),
    );
  });

  it("shows only relevant lessons for calmer answer sets", () => {
    const steps = getVisibleFlowSteps({
      caffeine_amount: "light",
      caffeine_timing: "before_noon",
      screen_habit: "very_little",
      work_after_dinner: "rarely",
      schedule_consistency: "very_consistent",
      weekend_wake_shift: "same",
      stress_level: "calm",
      sleep_thoughts: "neutral",
      sleep_latency: "under_15",
      wake_after_sleep_onset: "under_15",
      bed_use_pattern: "sleep_only",
      awake_response: "get_out",
      daytime_impact: "mild",
    });

    expect(steps.map((step) => step.id)).toContain("lesson_anchor_wake");
    expect(steps.map((step) => step.id)).not.toContain("email_capture");
    expect(steps.map((step) => step.id)).not.toContain("lesson_arousal");
    expect(steps.map((step) => step.id)).not.toContain("lesson_sleep_pressure");
  });
});
