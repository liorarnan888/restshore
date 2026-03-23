import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCalendarCopyReference,
  calendarCopyReferencePath,
} from "@/lib/calendar-copy-reference";

const exportIt = process.env.CALENDAR_COPY_EXPORT === "1" ? it : it.skip;

describe("calendar copy export task", () => {
  exportIt("writes the generated calendar copy reference to the repo", () => {
    const outputPath = path.join(process.cwd(), calendarCopyReferencePath);
    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, buildCalendarCopyReference(), "utf8");

    expect(outputPath.endsWith("calendar-event-descriptions.md")).toBe(true);
  });
});
