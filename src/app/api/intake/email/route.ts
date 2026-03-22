import { NextResponse } from "next/server";
import { z } from "zod";

import { captureEmail } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
  email: z.email(),
  nextStepId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await captureEmail(body.sessionId, body.email, body.nextStepId);

  return NextResponse.json({ session });
}
