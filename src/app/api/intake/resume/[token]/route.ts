import { NextResponse } from "next/server";

import { resumeIntakeSession } from "@/lib/session-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const session = await resumeIntakeSession(token);

  if (!session) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ session });
}
