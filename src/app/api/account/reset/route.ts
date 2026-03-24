import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { resetUserData } from "@/lib/session-service";

const schema = z.object({
  sessionId: z.string().min(1),
});

export async function DELETE(request: Request) {
  const body = schema.parse(await request.json());
  const authSession = await auth();

  if (!authSession?.user?.email && !authSession?.user?.id) {
    return NextResponse.json(
      { error: "Google sign-in required" },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const result = await resetUserData(body.sessionId, {
    userId: authSession.user?.id,
    email: authSession.user?.email,
    accessToken: authSession.googleAccessToken ?? undefined,
    refreshToken: authSession.googleRefreshToken ?? undefined,
    expiresAt: authSession.googleExpiresAt ?? undefined,
  });

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
