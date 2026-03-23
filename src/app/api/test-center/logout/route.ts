import { NextResponse } from "next/server";

import { TEST_CENTER_ACCESS_COOKIE_NAME } from "@/lib/test-center-access";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/test-center", request.url), 303);
  response.cookies.set(TEST_CENTER_ACCESS_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
