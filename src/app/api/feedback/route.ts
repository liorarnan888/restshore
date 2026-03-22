import { NextResponse } from "next/server";
import { z } from "zod";

import { createFeedbackEntry, recordAnalyticsEvent } from "@/lib/launch-data";

const schema = z.object({
  source: z.enum(["report", "checkin", "homepage", "followup_email"]),
  rating: z.number().int().min(1).max(5),
  message: z.string().trim().max(2000).optional(),
  sessionId: z.string().optional(),
  email: z.email().optional(),
  visitorId: z.string().optional(),
  route: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  const feedback = await createFeedbackEntry({
    source: body.source,
    rating: body.rating,
    message: body.message,
    sessionId: body.sessionId,
    email: body.email,
    metadata: {
      ...body.metadata,
      visitorId: body.visitorId,
      route: body.route,
      referrer: request.headers.get("referer") ?? undefined,
    },
  });

  await recordAnalyticsEvent({
    eventType: "feedback_submitted",
    sessionId: body.sessionId,
    visitorId: body.visitorId,
    route: body.route,
    referrer: request.headers.get("referer") ?? undefined,
    metadata: {
      source: body.source,
      rating: body.rating,
    },
  });

  return NextResponse.json(
    { feedback },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
