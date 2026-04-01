"use client";

const visitorStorageKey = "restshore-launch-visitor-id";
const resumeStorageKey = "restshore-resume-token";
const firstTouchStorageKey = "restshore-launch-first-touch";

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

function inferTrafficSource(referrer: string, utmMedium?: string | null) {
  if (utmMedium?.toLowerCase() === "organic") {
    return {
      firstTouchChannel: "organic_search",
      firstTouchSource: "utm",
    };
  }

  if (!referrer) {
    return {
      firstTouchChannel: "direct",
      firstTouchSource: "direct",
    };
  }

  try {
    const host = new URL(referrer).hostname.replace(/^www\./, "");

    if (
      host.includes("google.") ||
      host.includes("bing.com") ||
      host.includes("duckduckgo.com") ||
      host.includes("search.yahoo.com")
    ) {
      return {
        firstTouchChannel: "organic_search",
        firstTouchSource: host,
      };
    }

    if (
      host.includes("reddit.com") ||
      host.includes("x.com") ||
      host.includes("twitter.com") ||
      host.includes("linkedin.com") ||
      host.includes("facebook.com")
    ) {
      return {
        firstTouchChannel: "social",
        firstTouchSource: host,
      };
    }

    return {
      firstTouchChannel: "referral",
      firstTouchSource: host,
    };
  } catch {
    return {
      firstTouchChannel: "unknown",
      firstTouchSource: "unknown",
    };
  }
}

export function getOrCreateFirstTouchContext() {
  if (typeof window === "undefined") {
    return undefined;
  }

  const existing = readStorage(firstTouchStorageKey);

  if (existing) {
    try {
      return JSON.parse(existing) as Record<string, unknown>;
    } catch {
      // Ignore malformed local data and replace it below.
    }
  }

  const currentUrl = new URL(window.location.href);
  const referrer = document.referrer || "";
  const utmSource = currentUrl.searchParams.get("utm_source");
  const utmMedium = currentUrl.searchParams.get("utm_medium");
  const utmCampaign = currentUrl.searchParams.get("utm_campaign");
  const inferred = inferTrafficSource(referrer, utmMedium);
  const context = {
    firstTouchLandingPath: currentUrl.pathname,
    firstTouchReferrer: referrer || undefined,
    firstTouchSource: utmSource ?? inferred.firstTouchSource,
    firstTouchChannel: utmMedium ?? inferred.firstTouchChannel,
    firstTouchCampaign: utmCampaign ?? undefined,
  };

  writeStorage(firstTouchStorageKey, JSON.stringify(context));
  return context;
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
    const firstTouch = getOrCreateFirstTouchContext();
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
        metadata: {
          ...firstTouch,
          ...input.metadata,
        },
      }),
    });
  } catch {
    // Best-effort analytics should never block the beta experience.
  }
}
