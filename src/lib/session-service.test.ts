import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { buildDailyCheckInToken } from "@/lib/daily-checkin";
import {
  createFeedbackEntry,
  listAnalyticsEvents,
  listFeedbackEntries,
} from "@/lib/launch-data";
import {
  captureEmail,
  finalizeSession,
  getDailyCheckIn,
  getSession,
  processResumeReminders,
  resetUserData,
  resumeIntakeSession,
  saveAnswer,
  startIntakeSession,
  submitDailyCheckIn,
} from "@/lib/session-service";

const storePath = path.join(process.cwd(), "data", "sessions.json");
const launchStorePath = path.join(process.cwd(), "data", "launch.json");

describe("session service", () => {
  beforeEach(async () => {
    await rm(storePath, { force: true });
    await rm(launchStorePath, { force: true });
  });

  it("starts, saves, resumes, and finalizes a deeper session", async () => {
    const session = await startIntakeSession("Asia/Bangkok");

    const answers: Array<[string, string | string[], string]> = [
      ["primary_problem", "falling_asleep", "insomnia_duration"],
      ["insomnia_duration", "over_1_year", "daytime_impact"],
      ["daytime_impact", "high", "lesson_anchor_wake"],
    ];

    for (const [questionId, value, nextStepId] of answers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await captureEmail(session.id, "demo@example.com", "lesson_anchor_wake");

    const deeperAnswers: Array<[string, string | string[], string]> = [
      ["desired_wake_time", "07:00", "usual_bedtime"],
      ["usual_bedtime", "23:30", "weekend_wake_shift"],
      ["weekend_wake_shift", "1_2_hours", "time_in_bed"],
      ["time_in_bed", "8_9", "sleep_latency"],
      ["sleep_latency", "30_60", "wake_after_sleep_onset"],
      ["wake_after_sleep_onset", "30_60", "awakenings_count"],
      ["awakenings_count", "2_3", "early_wake_pattern"],
      ["early_wake_pattern", "1_2", "lesson_sleep_pressure"],
      ["schedule_consistency", "swings", "bed_use_pattern"],
      ["bed_use_pattern", "phone_or_tv", "awake_response"],
      ["awake_response", "stay_and_try", "lesson_stimulus_control"],
      ["caffeine_amount", "moderate", "caffeine_timing"],
      ["caffeine_timing", "late_afternoon", "alcohol_timing"],
      ["alcohol_timing", "some_evenings", "dinner_timing"],
      ["dinner_timing", "under_2_hours", "screen_habit"],
      ["screen_habit", "in_bed", "work_after_dinner"],
      ["work_after_dinner", "often", "lesson_arousal"],
      ["naps", "sometimes", "exercise_timing"],
      ["exercise_timing", "afternoon", "stress_level"],
      ["stress_level", "busy", "sleep_thoughts"],
      ["sleep_thoughts", "pressure", "relaxation_experience"],
      ["relaxation_experience", "inconsistent", "sleep_medication"],
      ["sleep_medication", "none", "sleep_environment"],
      ["sleep_environment", "noise", "impact_areas"],
      ["impact_areas", ["work", "mood"], "red_flags"],
      ["red_flags", ["none"], "motivation"],
      ["motivation", "steady", "lesson_consistency"],
    ];

    for (const [questionId, value, nextStepId] of deeperAnswers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    const resumed = await resumeIntakeSession(session.resumeToken);
    expect(resumed?.email).toBe("demo@example.com");

    const finalized = await finalizeSession(session.id);
    expect(finalized.generatedPlan?.durationWeeks).toBe(6);
    expect(finalized.generatedPlan?.events.length).toBeGreaterThan(0);
    expect(finalized.generatedReport?.headline).toContain("6-week");
  }, 15000);

  it("marks reminders as sent once processed", async () => {
    const session = await startIntakeSession("Asia/Bangkok");
    await captureEmail(session.id, "demo@example.com", "lesson_anchor_wake");

    const raw = JSON.parse(await readFile(storePath, "utf8")) as {
      sessions: Record<string, { reminderQueuedAt?: string }>;
      resumeIndex: Record<string, string>;
    };
    raw.sessions[session.id].reminderQueuedAt = new Date(Date.now() - 1000).toISOString();

    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(raw, null, 2), "utf8");

    const processed = await processResumeReminders();
    expect(processed).toContain(session.id);
  });

  it("stores a nightly log and updates the past sleep event", async () => {
    const session = await startIntakeSession("Asia/Bangkok");

    const answers: Array<[string, string | string[], string]> = [
      ["primary_problem", "falling_asleep", "insomnia_duration"],
      ["insomnia_duration", "over_1_year", "daytime_impact"],
      ["daytime_impact", "high", "lesson_anchor_wake"],
    ];

    for (const [questionId, value, nextStepId] of answers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await captureEmail(session.id, "demo@example.com", "lesson_anchor_wake");

    const deeperAnswers: Array<[string, string | string[], string]> = [
      ["desired_wake_time", "07:00", "usual_bedtime"],
      ["usual_bedtime", "23:30", "weekend_wake_shift"],
      ["weekend_wake_shift", "1_2_hours", "time_in_bed"],
      ["time_in_bed", "8_9", "sleep_latency"],
      ["sleep_latency", "30_60", "wake_after_sleep_onset"],
      ["wake_after_sleep_onset", "30_60", "awakenings_count"],
      ["awakenings_count", "2_3", "early_wake_pattern"],
      ["early_wake_pattern", "1_2", "lesson_sleep_pressure"],
      ["schedule_consistency", "swings", "bed_use_pattern"],
      ["bed_use_pattern", "phone_or_tv", "awake_response"],
      ["awake_response", "stay_and_try", "lesson_stimulus_control"],
      ["caffeine_amount", "moderate", "caffeine_timing"],
      ["caffeine_timing", "late_afternoon", "alcohol_timing"],
      ["alcohol_timing", "some_evenings", "dinner_timing"],
      ["dinner_timing", "under_2_hours", "screen_habit"],
      ["screen_habit", "in_bed", "work_after_dinner"],
      ["work_after_dinner", "often", "lesson_arousal"],
      ["naps", "sometimes", "exercise_timing"],
      ["exercise_timing", "afternoon", "stress_level"],
      ["stress_level", "busy", "sleep_thoughts"],
      ["sleep_thoughts", "pressure", "relaxation_experience"],
      ["relaxation_experience", "inconsistent", "sleep_medication"],
      ["sleep_medication", "none", "sleep_environment"],
      ["sleep_environment", "noise", "impact_areas"],
      ["impact_areas", ["work", "mood"], "red_flags"],
      ["red_flags", ["none"], "motivation"],
      ["motivation", "steady", "lesson_consistency"],
    ];

    for (const [questionId, value, nextStepId] of deeperAnswers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    const finalized = await finalizeSession(session.id);
    const raw = JSON.parse(await readFile(storePath, "utf8")) as {
      sessions: Record<string, { generatedPlan?: { events: Array<Record<string, unknown>> } }>;
      resumeIndex: Record<string, string>;
    };
    const mutableSession = raw.sessions[session.id];
    const generatedPlan = mutableSession.generatedPlan;

    if (!generatedPlan) {
      throw new Error("Generated plan missing in test");
    }

    const sleepEvent = generatedPlan.events.find(
      (event) => event.eventRole === "sleep_window",
    );
    const checkInEvent = generatedPlan.events.find(
      (event) => event.eventRole === "daily_checkin",
    );

    if (!sleepEvent || !checkInEvent) {
      throw new Error("Expected paired sleep/check-in events");
    }

    sleepEvent.startsAt = "2026-03-16T17:00:00.000Z";
    sleepEvent.endsAt = "2026-03-17T01:00:00.000Z";
    sleepEvent.plannedStartsAt = "2026-03-16T17:00:00.000Z";
    sleepEvent.plannedEndsAt = "2026-03-17T01:00:00.000Z";
    sleepEvent.nightDate = "2026-03-17";
    checkInEvent.startsAt = "2026-03-17T01:25:00.000Z";
    checkInEvent.endsAt = "2026-03-17T01:30:00.000Z";
    checkInEvent.nightDate = "2026-03-17";

    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(raw, null, 2), "utf8");

    const token = buildDailyCheckInToken(finalized.resumeToken, "2026-03-17");
    const loaded = await getDailyCheckIn(session.id, "2026-03-17", token);
    expect(loaded.draftDefaults.nightDate).toBe("2026-03-17");

    const submitted = await submitDailyCheckIn(session.id, "2026-03-17", token, {
      closenessToPlan: "bedtime_later",
      actualInBedTime: "00:35",
      actualOutOfBedTime: "07:02",
      nightPattern: "several_wakeups",
      awakeDuringNightBucket: "40_60",
      awakeningsBucket: "3_4",
      morningFunction: "tired_but_manageable",
    });

    expect(submitted.session.dailyCheckIns).toHaveLength(1);
    expect(submitted.sleepEvent?.title).toContain("Sleep");
    expect(submitted.sleepEvent?.title).not.toContain("Protected sleep window");
    expect(submitted.sleepEvent?.description).toContain("Logged outcome");
    expect(submitted.sleepEvent?.startsAt).toBe("2026-03-16T17:35:00.000Z");
    expect(submitted.sleepEvent?.endsAt).toBe("2026-03-17T00:02:00.000Z");
    expect(submitted.sleepEvent?.plannedStartsAt).toBe("2026-03-16T17:00:00.000Z");
    expect(submitted.sleepEvent?.plannedEndsAt).toBe("2026-03-17T01:00:00.000Z");
  }, 15000);

  it("retrofits daily check-in events onto older saved plans", async () => {
    const session = await startIntakeSession("Asia/Bangkok");

    const answers: Array<[string, string | string[], string]> = [
      ["primary_problem", "falling_asleep", "insomnia_duration"],
      ["insomnia_duration", "over_1_year", "daytime_impact"],
      ["daytime_impact", "high", "lesson_anchor_wake"],
    ];

    for (const [questionId, value, nextStepId] of answers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await captureEmail(session.id, "demo@example.com", "lesson_anchor_wake");

    const deeperAnswers: Array<[string, string | string[], string]> = [
      ["desired_wake_time", "07:00", "usual_bedtime"],
      ["usual_bedtime", "23:30", "weekend_wake_shift"],
      ["weekend_wake_shift", "1_2_hours", "time_in_bed"],
      ["time_in_bed", "8_9", "sleep_latency"],
      ["sleep_latency", "30_60", "wake_after_sleep_onset"],
      ["wake_after_sleep_onset", "30_60", "awakenings_count"],
      ["awakenings_count", "2_3", "early_wake_pattern"],
      ["early_wake_pattern", "1_2", "lesson_sleep_pressure"],
      ["schedule_consistency", "swings", "bed_use_pattern"],
      ["bed_use_pattern", "phone_or_tv", "awake_response"],
      ["awake_response", "stay_and_try", "lesson_stimulus_control"],
      ["caffeine_amount", "moderate", "caffeine_timing"],
      ["caffeine_timing", "late_afternoon", "alcohol_timing"],
      ["alcohol_timing", "some_evenings", "dinner_timing"],
      ["dinner_timing", "under_2_hours", "screen_habit"],
      ["screen_habit", "in_bed", "work_after_dinner"],
      ["work_after_dinner", "often", "lesson_arousal"],
      ["naps", "sometimes", "exercise_timing"],
      ["exercise_timing", "afternoon", "stress_level"],
      ["stress_level", "busy", "sleep_thoughts"],
      ["sleep_thoughts", "pressure", "relaxation_experience"],
      ["relaxation_experience", "inconsistent", "sleep_medication"],
      ["sleep_medication", "none", "sleep_environment"],
      ["sleep_environment", "noise", "impact_areas"],
      ["impact_areas", ["work", "mood"], "red_flags"],
      ["red_flags", ["none"], "motivation"],
      ["motivation", "steady", "lesson_consistency"],
    ];

    for (const [questionId, value, nextStepId] of deeperAnswers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await finalizeSession(session.id);

    const raw = JSON.parse(await readFile(storePath, "utf8")) as {
      sessions: Record<string, { generatedPlan?: { events: Array<Record<string, unknown>> } }>;
      resumeIndex: Record<string, string>;
    };
    const mutableSession = raw.sessions[session.id];
    const generatedPlan = mutableSession.generatedPlan;

    if (!generatedPlan) {
      throw new Error("Generated plan missing in test");
    }

    generatedPlan.events = generatedPlan.events
      .filter((event) => event.eventRole !== "daily_checkin")
      .map((event) => {
        if (event.eventType !== "bed") {
          return event;
        }

        const nextEvent = { ...event };
        delete nextEvent.eventRole;
        delete nextEvent.nightDate;
        delete nextEvent.baseTitle;
        delete nextEvent.baseDescription;
        delete nextEvent.actionUrl;
        return nextEvent;
      });

    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(raw, null, 2), "utf8");

    const reloaded = await getSession(session.id);

    expect(reloaded?.generatedPlan?.events.some((event) => event.eventRole === "daily_checkin")).toBe(
      true,
    );
    expect(
      reloaded?.generatedPlan?.events.some(
        (event) => event.eventRole === "sleep_window" && event.nightDate,
      ),
    ).toBe(true);
  }, 10000);

  it("repairs legacy generated reports when loading an old session", async () => {
    const session = await startIntakeSession("Asia/Bangkok");

    const answers: Array<[string, string | string[], string]> = [
      ["primary_problem", "falling_asleep", "insomnia_duration"],
      ["insomnia_duration", "over_1_year", "daytime_impact"],
      ["daytime_impact", "high", "lesson_anchor_wake"],
    ];

    for (const [questionId, value, nextStepId] of answers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await captureEmail(session.id, "demo@example.com", "lesson_anchor_wake");

    const deeperAnswers: Array<[string, string | string[], string]> = [
      ["desired_wake_time", "07:00", "usual_bedtime"],
      ["usual_bedtime", "23:30", "weekend_wake_shift"],
      ["weekend_wake_shift", "1_2_hours", "time_in_bed"],
      ["time_in_bed", "8_9", "sleep_latency"],
      ["sleep_latency", "30_60", "wake_after_sleep_onset"],
      ["wake_after_sleep_onset", "30_60", "awakenings_count"],
      ["awakenings_count", "2_3", "early_wake_pattern"],
      ["early_wake_pattern", "1_2", "lesson_sleep_pressure"],
      ["schedule_consistency", "swings", "bed_use_pattern"],
      ["bed_use_pattern", "phone_or_tv", "awake_response"],
      ["awake_response", "stay_and_try", "lesson_stimulus_control"],
      ["caffeine_amount", "moderate", "caffeine_timing"],
      ["caffeine_timing", "late_afternoon", "alcohol_timing"],
      ["alcohol_timing", "some_evenings", "dinner_timing"],
      ["dinner_timing", "under_2_hours", "screen_habit"],
      ["screen_habit", "in_bed", "work_after_dinner"],
      ["work_after_dinner", "often", "lesson_arousal"],
      ["naps", "sometimes", "exercise_timing"],
      ["exercise_timing", "afternoon", "stress_level"],
      ["stress_level", "busy", "sleep_thoughts"],
      ["sleep_thoughts", "pressure", "relaxation_experience"],
      ["relaxation_experience", "inconsistent", "sleep_medication"],
      ["sleep_medication", "none", "sleep_environment"],
      ["sleep_environment", "noise", "impact_areas"],
      ["impact_areas", ["work", "mood"], "red_flags"],
      ["red_flags", ["none"], "motivation"],
      ["motivation", "steady", "lesson_consistency"],
    ];

    for (const [questionId, value, nextStepId] of deeperAnswers) {
      await saveAnswer(session.id, questionId, value, nextStepId);
    }

    await finalizeSession(session.id);

    const rawBefore = JSON.parse(await readFile(storePath, "utf8")) as {
      sessions: Record<string, { generatedReport?: { clinicianSummary?: string[]; html?: string } }>;
      resumeIndex: Record<string, string>;
    };

    const storedReport = rawBefore.sessions[session.id]?.generatedReport;

    if (!storedReport) {
      throw new Error("Generated report missing in test");
    }

    storedReport.clinicianSummary = [
      "Primary complaint: falling asleep.",
      "Duration: 13 months. Daytime impact: mild.",
      "Current pattern: bedtime around 23:00, desired wake time 07:00, estimated starting sleep window 7 hours.",
    ];
    storedReport.html = `${storedReport.html ?? ""}\n<!-- legacy 13 months -->`;

    await mkdir(path.dirname(storePath), { recursive: true });
    await writeFile(storePath, JSON.stringify(rawBefore, null, 2), "utf8");

    const repaired = await getSession(session.id);

    expect(repaired?.generatedReport?.clinicianSummary.join(" ")).toContain("more than a year");
    expect(repaired?.generatedReport?.clinicianSummary.join(" ")).not.toContain("13 months");
    expect(repaired?.generatedReport?.clinicianSummary.join(" ")).toContain("Current usual bedtime");

    const rawAfter = JSON.parse(await readFile(storePath, "utf8")) as {
      sessions: Record<string, { generatedReport?: { clinicianSummary?: string[]; html?: string } }>;
    };
    const repairedReport = rawAfter.sessions[session.id]?.generatedReport;

    expect(repairedReport?.clinicianSummary?.join(" ")).toContain("more than a year");
    expect(repairedReport?.clinicianSummary?.join(" ")).not.toContain("13 months");
  }, 10000);

  it("resets every saved session and launch artifact for the connected email", async () => {
    const firstSession = await startIntakeSession("Asia/Bangkok");
    await captureEmail(firstSession.id, "demo@example.com", "lesson_anchor_wake");

    const secondSession = await startIntakeSession("Asia/Bangkok");
    await captureEmail(secondSession.id, "demo@example.com", "lesson_anchor_wake");

    await createFeedbackEntry({
      source: "report",
      rating: 4,
      message: "Need a clean slate.",
      sessionId: firstSession.id,
      email: "demo@example.com",
    });

    await createFeedbackEntry({
      source: "email_follow_up",
      rating: 5,
      message: "Another note.",
      sessionId: secondSession.id,
      email: "demo@example.com",
    });

    const analyticsBefore = await listAnalyticsEvents();
    const feedbackBefore = await listFeedbackEntries();

    expect(analyticsBefore).toHaveLength(4);
    expect(feedbackBefore).toHaveLength(2);

    const result = await resetUserData(firstSession.id, {
      email: "demo@example.com",
    });

    expect(result.deletedSessionCount).toBe(2);
    expect(result.analyticsDeleted).toBe(4);
    expect(result.feedbackDeleted).toBe(2);
    expect(result.calendarDeletionWarnings).toEqual([]);

    expect(await getSession(firstSession.id)).toBeNull();
    expect(await getSession(secondSession.id)).toBeNull();
    expect(await resumeIntakeSession(firstSession.resumeToken)).toBeNull();
    expect(await resumeIntakeSession(secondSession.resumeToken)).toBeNull();
    expect(await listAnalyticsEvents()).toEqual([]);
    expect(await listFeedbackEntries()).toEqual([]);
  });
});
