import { NextResponse } from "next/server";

import { processBetaFeedbackFollowUps } from "@/lib/session-service";

function isAuthorizedCronRequest(request: Request) {
  if (!process.env.CRON_SECRET) {
    return true;
  }

  return request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
}

export async function POST() {
  const processed = await processBetaFeedbackFollowUps();
  return NextResponse.json({ processed });
}

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const processed = await processBetaFeedbackFollowUps();
  return NextResponse.json({ processed });
}
