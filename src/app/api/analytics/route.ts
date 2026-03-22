import { NextResponse } from "next/server";
import { z } from "zod";

import { recordAnalyticsEvent } from "@/lib/launch-data";

const schema = z.object({
  eventType: z.enum([
    "page_view",
    "intake_started",
    "email_captured",
    "report_generated",
    "calendar_connected",
    "checkin_submitted",
    "first_checkin_submitted",
    "feedback_submitted",
  ]),
  sessionId: z.string().optional(),
  visitorId: z.string().optional(),
  route: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());

  await recordAnalyticsEvent({
    eventType: body.eventType,
    sessionId: body.sessionId,
    visitorId: body.visitorId,
    route: body.route,
    referrer: body.referrer ?? request.headers.get("referer") ?? undefined,
    metadata: body.metadata,
  });

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
