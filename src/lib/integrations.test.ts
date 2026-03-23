import { describe, expect, it } from "vitest";

import { buildCalendarRequestBody } from "@/lib/integrations";
import type { ProgramEvent } from "@/lib/types";

describe("calendar sync payloads", () => {
  it("preserves the user timezone when building Google event payloads", () => {
    const event = {
      id: "2026-03-23-wake",
      title: "⏰ Wake-up anchor",
      description: "Keep the anchor steady.",
      startsAt: "2026-03-23T00:00:00.000Z",
      endsAt: "2026-03-23T00:15:00.000Z",
      dayLabel: "Mon, Mar 23",
      weekNumber: 1,
      calendarColorId: "10",
      eventType: "wake",
    } satisfies ProgramEvent;

    expect(buildCalendarRequestBody(event, "Asia/Bangkok")).toEqual({
      summary: "⏰ Wake-up anchor",
      description: "Keep the anchor steady.",
      colorId: "10",
      start: {
        dateTime: "2026-03-23T00:00:00.000Z",
        timeZone: "Asia/Bangkok",
      },
      end: {
        dateTime: "2026-03-23T00:15:00.000Z",
        timeZone: "Asia/Bangkok",
      },
    });
  });
});
