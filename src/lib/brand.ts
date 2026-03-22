export const brandName = "RestShore";
export const brandTagline = "A calmer, structured way to rebuild sleep";
export const betaLabel = "Free public beta";
export const brandDescription =
  "A CBT-I informed sleep coaching beta that turns your answers into a 6-week plan, a doctor-ready sleep report, and optional calendar guidance you can actually follow.";
export const appSupportPromise =
  "RestShore is a behavioral support product, not medical care, diagnosis, or emergency help.";
export const betaFeedbackMessage =
  "This beta is free while we learn from early users. We read every thoughtful piece of feedback.";
export const feedbackFollowUpDelayHours = 36;
export const supportEmail =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "support@restshore.com";
export const policyEffectiveDate = "March 21, 2026";

export function supportMailto(subject?: string) {
  const encodedSubject = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${supportEmail}${encodedSubject}`;
}

function normalizeUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

export function appBaseUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  if (vercelProductionUrl) {
    return normalizeUrl(vercelProductionUrl);
  }

  const vercelUrl = process.env.VERCEL_URL;

  if (vercelUrl) {
    return normalizeUrl(vercelUrl);
  }

  return "http://localhost:3000";
}
