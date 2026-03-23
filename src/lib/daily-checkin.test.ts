import {
  deriveLoggedSleepTags,
  ensurePlanHasDailyCheckInEvents,
  normalizeDailyCheckInDraft,
  reconcileDailyCheckInsForPlan,
  validateLoggedSleepTimes,
} from "@/lib/daily-checkin";
import type { GeneratedPlan, ProgramEvent } from "@/lib/types";

describe("daily check-in tagging", () => {
  it("does not mark a late rise when only bedtime drifted", () => {
    const sleepEvent: ProgramEvent = {
      id: "2026-03-18-bed-sleep-window",
      title: "Sleep",
      baseTitle: "Protected sleep window",
      description: "Sleep window",
      baseDescription: "Sleep window",
      startsAt: "2026-03-18T19:00:00.000Z",
      endsAt: "2026-03-19T02:00:00.000Z",
      dayLabel: "Wed, Mar 18",
      weekNumber: 1,
      nightDate: "2026-03-19",
      eventRole: "sleep_window",
      eventType: "bed",
    };

    const tags = deriveLoggedSleepTags(
      {
        nightDate: "2026-03-19",
        sleepEventId: sleepEvent.id,
        checkInEventId: "2026-03-19-checkin-daily-log",
        closenessToPlan: "bedtime_later",
        actualInBedTime: "02:35",
        actualOutOfBedTime: "09:00",
        nightPattern: "fell_asleep_quickly",
        morningFunction: "good_enough",
      },
      sleepEvent,
    );

    expect(tags).toContain("late start");
    expect(tags).not.toContain("late rise");
  });

  it("clears stale branch-only fields when the night pattern changes", () => {
    const normalized = normalizeDailyCheckInDraft({
      closenessToPlan: "close_to_plan",
      actualInBedTime: "02:15",
      actualOutOfBedTime: "09:00",
      nightPattern: "fell_asleep_quickly",
      sleepLatencyBucket: "40_60",
      awakeDuringNightBucket: "40_60",
      awakeningsBucket: "3_4",
      earlyWakeBucket: "60_90",
      morningFunction: "good_enough",
    });

    expect(normalized.sleepLatencyBucket).toBeUndefined();
    expect(normalized.awakeDuringNightBucket).toBeUndefined();
    expect(normalized.awakeningsBucket).toBeUndefined();
    expect(normalized.earlyWakeBucket).toBeUndefined();
  });

  it("rejects a bedtime that looks like a wake time", () => {
    const validation = validateLoggedSleepTimes(
      "09:00",
      "07:00",
      "00:00",
      "07:00",
    );

    expect(validation.valid).toBe(false);
    expect(validation.message).toContain("overnight sleep period");
  });

  it("accepts a coherent overnight window near the plan", () => {
    const validation = validateLoggedSleepTimes(
      "02:45",
      "08:10",
      "00:00",
      "07:00",
    );

    expect(validation.valid).toBe(true);
  });

  it("updates the sleep event to the logged times when the interval is coherent", () => {
    const sleepEvent: ProgramEvent = {
      id: "2026-03-22-bed-sleep-window",
      title: "Sleep",
      baseTitle: "Protected sleep window",
      description: "Sleep window",
      baseDescription: "Sleep window",
      startsAt: "2026-03-22T17:00:00.000Z",
      endsAt: "2026-03-23T00:00:00.000Z",
      plannedStartsAt: "2026-03-22T17:00:00.000Z",
      plannedEndsAt: "2026-03-23T00:00:00.000Z",
      dayLabel: "Sun, Mar 22",
      weekNumber: 1,
      nightDate: "2026-03-23",
      eventRole: "sleep_window",
      eventType: "bed",
    };
    const plan: GeneratedPlan = {
      timezone: "Asia/Bangkok",
      durationWeeks: 6,
      wakeTime: "7:00 AM",
      bedtimeTarget: "12:00 AM",
      screenCutoff: "11:00 PM",
      caffeineCutoff: "2:00 PM",
      windDownStart: "11:15 PM",
      mealCutoff: "9:00 PM",
      lightWindow: "7:15 AM",
      exerciseWindow: "4:00 PM",
      napGuidance: "Avoid naps",
      sleepWindow: "7 hours",
      weekendGuardrail: "Keep the same wake time",
      calendarName: "RestShore 6-Week Plan",
      events: [
        sleepEvent,
        {
          id: "2026-03-23-checkin-daily-log",
          title: "Morning sleep log",
          description: "Log",
          startsAt: "2026-03-23T00:25:00.000Z",
          endsAt: "2026-03-23T00:30:00.000Z",
          dayLabel: "Mon, Mar 23",
          weekNumber: 1,
          nightDate: "2026-03-23",
          eventRole: "daily_checkin",
          eventType: "checkin",
        },
      ],
      weekSummaries: [],
      insightTags: [],
    };

    const reconciled = reconcileDailyCheckInsForPlan(plan, [
      {
        nightDate: "2026-03-23",
        sleepEventId: sleepEvent.id,
        checkInEventId: "2026-03-23-checkin-daily-log",
        closenessToPlan: "both_drifted",
        actualInBedTime: "02:45",
        actualOutOfBedTime: "08:10",
        nightPattern: "rough_mix",
        morningFunction: "tired_but_manageable",
        derivedTitleTags: ["late start"],
        submittedAt: "2026-03-23T01:00:00.000Z",
        updatedAt: "2026-03-23T01:00:00.000Z",
      },
    ]);

    const updatedSleepEvent = reconciled.plan.events.find(
      (event) => event.id === sleepEvent.id,
    );

    expect(updatedSleepEvent).toBeDefined();
    expect(updatedSleepEvent?.startsAt).not.toBe(sleepEvent.startsAt);
    expect(updatedSleepEvent?.endsAt).not.toBe(sleepEvent.endsAt);
    expect(new Date(updatedSleepEvent?.endsAt ?? 0).getTime()).toBeGreaterThan(
      new Date(updatedSleepEvent?.startsAt ?? 0).getTime(),
    );
    expect(updatedSleepEvent?.description).toContain("Event timing updated: yes");
  });

  it("places the daily check-in five hours after the sleep window ends", () => {
    const sleepEvent: ProgramEvent = {
      id: "2026-03-22-bed-sleep-window",
      title: "Sleep",
      baseTitle: "Protected sleep window",
      description: "Sleep window",
      baseDescription: "Sleep window",
      startsAt: "2026-03-22T17:00:00.000Z",
      endsAt: "2026-03-23T00:00:00.000Z",
      plannedStartsAt: "2026-03-22T17:00:00.000Z",
      plannedEndsAt: "2026-03-23T00:00:00.000Z",
      dayLabel: "Sun, Mar 22",
      weekNumber: 1,
      nightDate: "2026-03-23",
      eventRole: "sleep_window",
      eventType: "bed",
    };
    const plan: GeneratedPlan = {
      timezone: "Asia/Bangkok",
      durationWeeks: 6,
      wakeTime: "7:00 AM",
      bedtimeTarget: "12:00 AM",
      screenCutoff: "11:00 PM",
      caffeineCutoff: "2:00 PM",
      windDownStart: "11:15 PM",
      mealCutoff: "9:00 PM",
      lightWindow: "7:15 AM",
      exerciseWindow: "4:00 PM",
      napGuidance: "Avoid naps",
      sleepWindow: "7 hours",
      weekendGuardrail: "Keep the same wake time",
      calendarName: "RestShore 6-Week Plan",
      events: [
        sleepEvent,
        {
          id: "2026-03-23-checkin-daily-log",
          title: "Morning sleep log",
          description: "Log",
          startsAt: "2026-03-23T00:25:00.000Z",
          endsAt: "2026-03-23T00:30:00.000Z",
          dayLabel: "Mon, Mar 23",
          weekNumber: 1,
          nightDate: "2026-03-23",
          eventRole: "daily_checkin",
          eventType: "checkin",
        },
      ],
      weekSummaries: [],
      insightTags: [],
    };

    const ensured = ensurePlanHasDailyCheckInEvents(plan);
    const checkInEvent = ensured.plan.events.find(
      (event) => event.eventRole === "daily_checkin",
    );

    expect(checkInEvent).toBeDefined();
    expect(checkInEvent?.startsAt).toBe("2026-03-23T05:00:00.000Z");
    expect(checkInEvent?.endsAt).toBe("2026-03-23T05:05:00.000Z");
    expect(ensured.changedEventIds).toContain("2026-03-23-checkin-daily-log");
  });

  it("keeps the planned sleep window when the logged times do not map to one overnight period", () => {
    const sleepEvent: ProgramEvent = {
      id: "2026-03-22-bed-sleep-window",
      title: "Sleep",
      baseTitle: "Protected sleep window",
      description: "Sleep window",
      baseDescription: "Sleep window",
      startsAt: "2026-03-22T17:00:00.000Z",
      endsAt: "2026-03-23T00:00:00.000Z",
      plannedStartsAt: "2026-03-22T17:00:00.000Z",
      plannedEndsAt: "2026-03-23T00:00:00.000Z",
      dayLabel: "Sun, Mar 22",
      weekNumber: 1,
      nightDate: "2026-03-23",
      eventRole: "sleep_window",
      eventType: "bed",
    };
    const plan: GeneratedPlan = {
      timezone: "Asia/Bangkok",
      durationWeeks: 6,
      wakeTime: "7:00 AM",
      bedtimeTarget: "12:00 AM",
      screenCutoff: "11:00 PM",
      caffeineCutoff: "2:00 PM",
      windDownStart: "11:15 PM",
      mealCutoff: "9:00 PM",
      lightWindow: "7:15 AM",
      exerciseWindow: "4:00 PM",
      napGuidance: "Avoid naps",
      sleepWindow: "7 hours",
      weekendGuardrail: "Keep the same wake time",
      calendarName: "RestShore 6-Week Plan",
      events: [
        sleepEvent,
        {
          id: "2026-03-23-checkin-daily-log",
          title: "Morning sleep log",
          description: "Log",
          startsAt: "2026-03-23T00:25:00.000Z",
          endsAt: "2026-03-23T00:30:00.000Z",
          dayLabel: "Mon, Mar 23",
          weekNumber: 1,
          nightDate: "2026-03-23",
          eventRole: "daily_checkin",
          eventType: "checkin",
        },
      ],
      weekSummaries: [],
      insightTags: [],
    };

    const reconciled = reconcileDailyCheckInsForPlan(plan, [
      {
        nightDate: "2026-03-23",
        sleepEventId: sleepEvent.id,
        checkInEventId: "2026-03-23-checkin-daily-log",
        closenessToPlan: "both_drifted",
        actualInBedTime: "09:00",
        actualOutOfBedTime: "07:00",
        nightPattern: "several_wakeups",
        morningFunction: "tired_but_manageable",
        awakeningsBucket: "2",
        awakeDuringNightBucket: "20_40",
        derivedTitleTags: ["late start"],
        submittedAt: "2026-03-23T01:00:00.000Z",
        updatedAt: "2026-03-23T01:00:00.000Z",
      },
    ]);

    const updatedSleepEvent = reconciled.plan.events.find(
      (event) => event.id === sleepEvent.id,
    );

    expect(updatedSleepEvent).toBeDefined();
    expect(updatedSleepEvent?.startsAt).toBe(sleepEvent.startsAt);
    expect(updatedSleepEvent?.endsAt).toBe(sleepEvent.endsAt);
    expect(updatedSleepEvent?.description).toContain(
      "kept on the planned window because the logged times did not map cleanly",
    );
    expect(new Date(updatedSleepEvent?.endsAt ?? 0).getTime()).toBeGreaterThan(
      new Date(updatedSleepEvent?.startsAt ?? 0).getTime(),
    );
  });
});
