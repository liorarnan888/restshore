import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { submitDailyCheckIn } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
  nightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  token: z.string().min(1),
  entry: z.object({
    closenessToPlan: z.enum([
      "close_to_plan",
      "bedtime_later",
      "wake_drifted",
      "both_drifted",
      "hard_to_say",
    ]),
    actualInBedTime: z.string().regex(/^\d{2}:\d{2}$/),
    actualOutOfBedTime: z.string().regex(/^\d{2}:\d{2}$/),
    nightPattern: z.enum([
      "fell_asleep_quickly",
      "slow_sleep",
      "several_wakeups",
      "early_wake",
      "rough_mix",
    ]),
    sleepLatencyBucket: z
      .enum(["under_20", "20_40", "40_60", "over_60"])
      .optional(),
    awakeDuringNightBucket: z
      .enum(["under_20", "20_40", "40_60", "over_60"])
      .optional(),
    awakeningsBucket: z.enum(["1", "2", "3_4", "5_plus"]).optional(),
    earlyWakeBucket: z
      .enum(["under_30", "30_60", "60_90", "over_90"])
      .optional(),
    morningFunction: z.enum([
      "good_enough",
      "tired_but_manageable",
      "running_on_fumes",
    ]),
  }),
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
    const payload = await submitDailyCheckIn(
      body.sessionId,
      body.nightDate,
      body.token,
      body.entry,
      authContextFromSession(authSession),
    );

    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to submit check-in" },
      { status: 400 },
    );
  }
}
