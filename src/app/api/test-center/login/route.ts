import { NextResponse } from "next/server";

import {
  buildTestCenterAccessCookie,
  isTestCenterAuthConfigured,
  sanitizeTestCenterRedirectTarget,
  verifyTestCenterPassword,
} from "@/lib/test-center-access";

export async function POST(request: Request) {
  const formData = await request.formData();
  const passwordEntry = formData.get("password");
  const password = typeof passwordEntry === "string" ? passwordEntry : "";
  const redirectEntry = formData.get("redirectTo");
  const redirectTarget = sanitizeTestCenterRedirectTarget(
    typeof redirectEntry === "string" ? redirectEntry : null,
    "/test-center",
  );

  if (!isTestCenterAuthConfigured()) {
    return NextResponse.redirect(new URL("/test-center?error=unavailable", request.url), 303);
  }

  if (!verifyTestCenterPassword(password)) {
    const url = new URL(redirectTarget, request.url);
    url.searchParams.set("error", "invalid");
    return NextResponse.redirect(url, 303);
  }

  const cookie = buildTestCenterAccessCookie();

  if (!cookie) {
    return NextResponse.redirect(new URL("/test-center?error=unavailable", request.url), 303);
  }

  const response = NextResponse.redirect(new URL(redirectTarget, request.url), 303);
  response.cookies.set(cookie.name, cookie.value, cookie.options);
  return response;
}
