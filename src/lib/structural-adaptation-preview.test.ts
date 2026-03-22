import { buildGeneratedPlan, buildSleepProfile } from "@/lib/plan-engine";
import { previewStructuralScenario } from "@/lib/structural-adaptation-preview";

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

function buildFixturePlan() {
  const profile = buildSleepProfile(baseAnswers, "Asia/Bangkok");
  return buildGeneratedPlan(profile);
}

describe("structural adaptation preview", () => {
  it("shows an expand decision with full review-window visibility", () => {
    const preview = previewStructuralScenario(buildFixturePlan(), "stable_expand");

    expect(preview.decision.bucket).toBe("expand");
    expect(preview.reviewWindow).toHaveLength(7);
    expect(preview.reviewWindow.every((night) => night.status === "logged")).toBe(true);
    expect(preview.planBeforeAfter.find((item) => item.label === "Sleep window")?.changed).toBe(true);
    expect(
      preview.nextSchedulePreview.find((item) => item.label === "Wake-up anchor")?.changed,
    ).toBe(false);
  });

  it("shows hold when logs are too sparse", () => {
    const preview = previewStructuralScenario(buildFixturePlan(), "insufficient_logs");

    expect(preview.decision.bucket).toBe("hold");
    expect(preview.decision.reasonCode).toBe("insufficient_logs");
    expect(preview.reviewWindow.filter((night) => night.status === "missing")).toHaveLength(3);
    expect(preview.planBeforeAfter.every((item) => item.changed === false)).toBe(true);
  });

  it("shows a shrink decision with later bedtime", () => {
    const preview = previewStructuralScenario(buildFixturePlan(), "low_efficiency_shrink");

    expect(preview.decision.bucket).toBe("shrink");
    const bedtime = preview.planBeforeAfter.find((item) => item.label === "Bedtime target");
    expect(bedtime?.changed).toBe(true);
    expect(preview.nextSchedulePreview.find((item) => item.label === "Digital sunset")?.changed).toBe(true);
  });
});
