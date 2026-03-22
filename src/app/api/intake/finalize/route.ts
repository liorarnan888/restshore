import { NextResponse } from "next/server";
import { z } from "zod";

import { finalizeSession } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await finalizeSession(body.sessionId);
  return NextResponse.json({ session });
}
