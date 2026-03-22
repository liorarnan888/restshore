import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { getDailyCheckIn } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
  nightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  token: z.string().min(1),
});

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
    const body = schema.parse(await request.json());
    const authSession = await auth();
    const payload = await getDailyCheckIn(
      body.sessionId,
      body.nightDate,
      body.token,
      authContextFromSession(authSession),
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load check-in" },
      { status: 400 },
    );
  }
}
