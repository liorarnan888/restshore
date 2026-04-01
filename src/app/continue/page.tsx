import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { auth } from "@/auth";
import { isGoogleAuthConfigured } from "@/lib/env";
import { buildPageMetadata } from "@/lib/seo";
import { findPreferredSessionForAccount } from "@/lib/session-service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildPageMetadata({
  title: "Continue | RestShore",
  description: "Reconnect to an existing RestShore plan.",
  path: "/continue",
  index: false,
});

export default async function ContinuePage() {
  if (!isGoogleAuthConfigured()) {
    redirect("/start");
  }

  const authSession = await auth();

  if (!authSession?.user?.id && !authSession?.user?.email) {
    redirect("/");
  }

  const preferredSession = await findPreferredSessionForAccount({
    userId: authSession?.user?.id,
    email: authSession?.user?.email,
  });

  if (!preferredSession) {
    redirect("/start");
  }

  if (preferredSession.generatedPlan && preferredSession.generatedReport) {
    redirect(`/report/${preferredSession.id}`);
  }

  redirect(`/start?resume=${preferredSession.resumeToken}`);
}
