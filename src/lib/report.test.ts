import { buildGeneratedPlan, buildSleepProfile } from "@/lib/plan-engine";
import { buildGeneratedReport } from "@/lib/report";

const baseAnswers = {
  primary_problem: "night_wakings",
  insomnia_duration: "over_1_year",
  daytime_impact: "mild",
  desired_wake_time: "07:00",
  usual_bedtime: "23:00",
  weekend_wake_shift: "1_2_hours",
  time_in_bed: "7_8",
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
  impact_areas: ["work", "focus"],
  red_flags: ["none"],
  motivation: "steady",
} as const;

describe("report copy", () => {
  it("renders the questionnaire duration bucket in plain language", () => {
    const profile = buildSleepProfile(baseAnswers, "Asia/Bangkok");
    const plan = buildGeneratedPlan(profile);
    const report = buildGeneratedReport(profile, plan);

    expect(report.clinicianSummary.join(" ")).toContain("more than a year");
    expect(report.clinicianSummary.join(" ")).not.toContain("13 months");

    const snapshot = report.sections.find((section) => section.title === "Sleep snapshot");

    expect(snapshot?.body).toContain("present for more than a year");
    expect(snapshot?.body).toContain("mild daytime impairment");
  });

  it("separates the current bedtime from the derived starting plan", () => {
    const profile = buildSleepProfile(baseAnswers, "Asia/Bangkok");
    const plan = buildGeneratedPlan(profile);
    const report = buildGeneratedReport(profile, plan);

    expect(report.clinicianSummary).toEqual(
      expect.arrayContaining([
        "Current usual bedtime: 23:00.",
        `Starting plan: wake anchor ${plan.wakeTime}, initial bedtime target ${plan.bedtimeTarget}, starting sleep window ${plan.sleepWindow}.`,
      ]),
    );

    const snapshot = report.sections.find((section) => section.title === "Sleep snapshot");

    expect(snapshot?.bullets).toEqual(
      expect.arrayContaining([
        "Current usual bedtime: 23:00",
        `Wake anchor: ${plan.wakeTime}`,
        `Initial bedtime target: ${plan.bedtimeTarget} from a ${plan.sleepWindow} starting sleep window`,
      ]),
    );
  });
});
