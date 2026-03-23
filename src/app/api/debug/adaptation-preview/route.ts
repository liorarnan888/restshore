import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionById } from "@/lib/session-repository";
import { previewAdaptiveScenario } from "@/lib/adaptive-plan";
import { hasTestCenterAccessFromCookieHeader } from "@/lib/test-center-access";

const schema = z.object({
  sessionId: z.string().min(1),
  scenario: z.enum([
    "single_bad_night",
    "double_late_start",
    "double_sleep_onset",
    "double_fragmented",
    "double_early_wake",
    "double_fatigue",
    "double_late_start_sleep_onset",
    "double_fragmented_fatigue",
    "double_early_wake_fatigue",
  ]),
});

export async function POST(request: Request) {
  if (
    process.env.NODE_ENV === "production" &&
    !hasTestCenterAccessFromCookieHeader(request.headers.get("cookie"))
  ) {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const body = schema.parse(await request.json());
    const session = await getSessionById(body.sessionId);

    if (!session?.generatedPlan) {
      throw new Error("Session not ready");
    }

    const preview = previewAdaptiveScenario(session.generatedPlan, body.scenario);
    return NextResponse.json(preview, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to preview scenario" },
      { status: 400 },
    );
  }
}
