import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionById } from "@/lib/session-repository";
import { previewStructuralScenario } from "@/lib/structural-adaptation-preview";

const schema = z.object({
  sessionId: z.string().min(1),
  scenario: z.enum([
    "stable_expand",
    "mixed_hold",
    "low_efficiency_shrink",
    "insufficient_logs",
    "contradictory_data",
    "red_flags",
    "context_shift",
    "severe_impairment",
  ]),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 404 });
  }

  try {
    const body = schema.parse(await request.json());
    const session = await getSessionById(body.sessionId);

    if (!session?.generatedPlan) {
      throw new Error("Session not ready");
    }

    const preview = previewStructuralScenario(session.generatedPlan, body.scenario);
    return NextResponse.json(preview, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to preview weekly structural review",
      },
      { status: 400 },
    );
  }
}
