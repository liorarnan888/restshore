import { NextResponse } from "next/server";
import { z } from "zod";

import { saveAnswer } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
  questionId: z.string().min(1),
  value: z.union([z.string(), z.array(z.string())]),
  nextStepId: z.string().optional(),
});

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const session = await saveAnswer(
    body.sessionId,
    body.questionId,
    body.value,
    body.nextStepId,
  );

  return NextResponse.json({ session });
}
