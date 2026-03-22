import { NextResponse } from "next/server";
import { z } from "zod";

import { restartIntakeSession } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await restartIntakeSession(body.sessionId);
  return NextResponse.json({ session });
}
