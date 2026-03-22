import {
  deriveLoggedSleepTags,
  normalizeDailyCheckInDraft,
} from "@/lib/daily-checkin";
import type { ProgramEvent } from "@/lib/types";

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
});
