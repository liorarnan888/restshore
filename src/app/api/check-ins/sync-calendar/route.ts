import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { syncDailyCheckInCalendar } from "@/lib/session-service";

type AuthSessionShape =
  | {
      user?: {
        id?: string;
        email?: string | null;
      };
      googleAccessToken?: string | null;
      googleRefreshToken?: string | null;
      googleExpiresAt?: number | null;
    }
  | null
  | undefined;

function authContextFromSession(authSession: AuthSessionShape) {
  return {
    userId: authSession?.user?.id,
    email: authSession?.user?.email,
    accessToken: authSession?.googleAccessToken,
    refreshToken: authSession?.googleRefreshToken,
    expiresAt: authSession?.googleExpiresAt,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      sessionId?: string;
      nightDate?: string;
      token?: string;
    };

    if (!body.sessionId || !body.nightDate || !body.token) {
      return NextResponse.json(
        { error: "Missing sessionId, nightDate, or token" },
        { status: 400 },
      );
    }

    const authSession = await auth();
    await syncDailyCheckInCalendar(
      body.sessionId,
      body.nightDate,
      body.token,
      authContextFromSession(authSession),
    );

    return NextResponse.json(
      { ok: true },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync calendar" },
      { status: 400 },
    );
  }
}
