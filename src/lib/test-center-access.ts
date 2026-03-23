import { createHmac, timingSafeEqual } from "node:crypto";

export const TEST_CENTER_ACCESS_COOKIE_NAME = "restshore_test_center_access";
const TEST_CENTER_ACCESS_VERSION = "v1";
const TEST_CENTER_ACCESS_TTL_SECONDS = 60 * 60 * 24;
const TEST_CENTER_FALLBACK_SECRET = "restshore-test-center-development-secret";

function getSigningSecret() {
  const explicitSecret = process.env.AUTH_SECRET?.trim() || process.env.NEXTAUTH_SECRET?.trim();

  if (explicitSecret) {
    return explicitSecret;
  }

  return process.env.NODE_ENV === "production" ? null : TEST_CENTER_FALLBACK_SECRET;
}

function signPayload(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function hasTestCenterPasswordConfigured() {
  return Boolean(process.env.TEST_CENTER_PASSWORD?.trim());
}

export function verifyTestCenterPassword(password: string) {
  const configuredPassword = process.env.TEST_CENTER_PASSWORD?.trim();

  if (!configuredPassword) {
    return false;
  }

  return safeEqual(configuredPassword, password);
}

export function isTestCenterAuthConfigured() {
  return Boolean(hasTestCenterPasswordConfigured() && getSigningSecret());
}

export function buildTestCenterAccessToken(now = Date.now()) {
  const secret = getSigningSecret();

  if (!secret) {
    return null;
  }

  const expiresAt = now + TEST_CENTER_ACCESS_TTL_SECONDS * 1000;
  const payload = `${TEST_CENTER_ACCESS_VERSION}.${expiresAt}`;
  const signature = signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function verifyTestCenterAccessToken(token?: string | null, now = Date.now()) {
  if (!token) {
    return false;
  }

  const secret = getSigningSecret();

  if (!secret) {
    return false;
  }

  const [version, expiresAtRaw, signature, ...rest] = token.split(".");

  if (rest.length || version !== TEST_CENTER_ACCESS_VERSION || !expiresAtRaw || !signature) {
    return false;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || now > expiresAt) {
    return false;
  }

  const expectedSignature = signPayload(`${version}.${expiresAtRaw}`, secret);
  return safeEqual(signature, expectedSignature);
}

export function buildTestCenterAccessCookie(now = Date.now()) {
  const value = buildTestCenterAccessToken(now);

  if (!value) {
    return null;
  }

  return {
    name: TEST_CENTER_ACCESS_COOKIE_NAME,
    value,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: TEST_CENTER_ACCESS_TTL_SECONDS,
    },
  };
}

export function getTestCenterCookieValue(cookieHeader?: string | null) {
  if (!cookieHeader) {
    return null;
  }

  const parts = cookieHeader.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${TEST_CENTER_ACCESS_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  return match.slice(TEST_CENTER_ACCESS_COOKIE_NAME.length + 1);
}

export function hasTestCenterAccessFromCookieHeader(cookieHeader?: string | null, now = Date.now()) {
  return verifyTestCenterAccessToken(getTestCenterCookieValue(cookieHeader), now);
}

export function sanitizeTestCenterRedirectTarget(
  redirectTarget?: string | null,
  fallback = "/test-center",
) {
  if (!redirectTarget) {
    return fallback;
  }

  const trimmed = redirectTarget.trim();

  if (
    trimmed !== "/test-center" &&
    !trimmed.startsWith("/test-center?") &&
    !trimmed.startsWith("/test-center#")
  ) {
    return fallback;
  }

  return trimmed || fallback;
}
