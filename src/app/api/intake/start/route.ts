import { NextResponse } from "next/server";
import { z } from "zod";

import { startIntakeSession } from "@/lib/session-service";

const schema = z.object({
  timezone: z.string().min(1).default("UTC"),
  visitorId: z.string().optional(),
  route: z.string().optional(),
  referrer: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await startIntakeSession(body.timezone, {
    visitorId: body.visitorId,
    route: body.route,
    referrer: body.referrer ?? request.headers.get("referer") ?? undefined,
    metadata: body.metadata,
  });
  return NextResponse.json({ session });
}
