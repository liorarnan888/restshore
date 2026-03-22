import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { connectGoogleAndDeliver, removeGoogleCalendar } from "@/lib/session-service";

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
};

const schema = z.object({
  sessionId: z.string().min(1),
});

const querySchema = z.object({
  sessionId: z.string().min(1),
  advance: z.string().optional(),
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = querySchema.parse({
    sessionId: searchParams.get("sessionId"),
    advance: searchParams.get("advance") ?? undefined,
  });
  const authSession = await auth();

  if (isGoogleAuthConfigured() && !authSession?.user?.id) {
    return NextResponse.json({ error: "Google sign-in required" }, { status: 401 });
  }

  const result = query.advance === "1"
    ? await connectGoogleAndDeliver(query.sessionId, authContextFromSession(authSession))
    : await connectGoogleAndDeliver(query.sessionId, authContextFromSession(authSession));

  return NextResponse.json(result, { headers: noStoreHeaders });
}

export async function POST(request: Request) {
  const body = schema.parse(await request.json());
  const authSession = await auth();

  if (isGoogleAuthConfigured() && !authSession?.user?.id) {
    return NextResponse.json({ error: "Google sign-in required" }, { status: 401 });
  }

  const result = await connectGoogleAndDeliver(
    body.sessionId,
    authContextFromSession(authSession),
  );
  return NextResponse.json(result, { headers: noStoreHeaders });
}

export async function DELETE(request: Request) {
  const body = schema.parse(await request.json());
  const authSession = await auth();

  if (isGoogleAuthConfigured() && !authSession?.user?.id) {
    return NextResponse.json({ error: "Google sign-in required" }, { status: 401 });
  }

  const result = await removeGoogleCalendar(
    body.sessionId,
    authContextFromSession(authSession),
  );
  return NextResponse.json(result, { headers: noStoreHeaders });
}
