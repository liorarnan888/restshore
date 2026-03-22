"use client";

const visitorStorageKey = "restshore-launch-visitor-id";
const resumeStorageKey = "restshore-resume-token";

function readStorage(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(key);
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, value);
}

export function getOrCreateLaunchVisitorId() {
  const existing = readStorage(visitorStorageKey);

  if (existing) {
    return existing;
  }

  const created =
    typeof window !== "undefined" && "randomUUID" in window.crypto
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  writeStorage(visitorStorageKey, created);
  return created;
}

export function readStoredResumeToken() {
  const current = readStorage(resumeStorageKey);

  if (current) {
    return current;
  }

  return null;
}

export function writeStoredResumeToken(token: string) {
  writeStorage(resumeStorageKey, token);
}

export async function recordClientAnalytics(input: {
  eventType:
    | "page_view"
    | "intake_started"
    | "email_captured"
    | "report_generated"
    | "calendar_connected"
    | "checkin_submitted"
    | "first_checkin_submitted"
    | "feedback_submitted";
  sessionId?: string;
  route?: string;
  metadata?: Record<string, unknown>;
}) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: input.eventType,
        sessionId: input.sessionId,
        visitorId: getOrCreateLaunchVisitorId(),
        route: input.route ?? `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer || undefined,
        metadata: input.metadata,
      }),
    });
  } catch {
    // Best-effort analytics should never block the beta experience.
  }
}
