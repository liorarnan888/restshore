"use client";

import { useEffect } from "react";

import { recordClientAnalytics } from "@/lib/launch-client";

export function LaunchPageView({
  route,
  sessionId,
  metadata,
}: {
  route: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}) {
  useEffect(() => {
    void recordClientAnalytics({
      eventType: "page_view",
      route,
      sessionId,
      metadata,
    });
  }, [metadata, route, sessionId]);

  return null;
}
