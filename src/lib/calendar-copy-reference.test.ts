import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCalendarCopyReference,
  calendarCopyReferencePath,
} from "@/lib/calendar-copy-reference";

describe("calendar copy reference", () => {
  it("matches the generated reference file in the repo", () => {
    const outputPath = path.join(process.cwd(), calendarCopyReferencePath);
    const committedFile = readFileSync(outputPath, "utf8");

    expect(committedFile).toBe(buildCalendarCopyReference());
  }, 30000);
});
