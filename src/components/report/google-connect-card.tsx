"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Sparkles,
  Trash2,
  Unplug,
} from "lucide-react";
import { signIn, signOut } from "next-auth/react";

import {
  appSupportPromise,
  brandName,
  supportEmail,
  supportMailto,
} from "@/lib/brand";
import type {
  CalendarSyncStage,
  CalendarSyncState,
  CalendarSyncStatus,
  DeliveryStatus,
} from "@/lib/types";

type GoogleConnectCardProps = {
  sessionId: string;
  variant?: "hero-cta" | "connected-strip";
  completed: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  hasCalendar: boolean;
  googleEmail?: string | null;
  authConfigured: boolean;
  connectOnLoad: boolean;
  deliverOnLoad: boolean;
  hasFailure: boolean;
  syncStatus: CalendarSyncStatus;
  syncState?: CalendarSyncState;
  reportStatus: DeliveryStatus;
  wakeTime: string;
  bedtimeTarget: string;
  sleepWindow: string;
  weekTitles: string[];
  eventCount: number;
};

export function GoogleConnectCard({
  sessionId,
  variant,
  completed,
  authenticated,
  calendarGranted,
  hasCalendar,
  googleEmail,
  authConfigured,
  connectOnLoad,
  deliverOnLoad,
  hasFailure,
  syncStatus,
  syncState,
  reportStatus,
  wakeTime,
  bedtimeTarget,
  sleepWindow,
  weekTitles,
  eventCount,
}: GoogleConnectCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(
    ((deliverOnLoad || connectOnLoad) &&
      authenticated &&
      !completed &&
      !calendarGranted) ||
      (deliverOnLoad && authenticated && calendarGranted && !completed),
  );
  const [reconnecting, setReconnecting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSyncStatus, setLocalSyncStatus] = useState<CalendarSyncStatus>(syncStatus);
  const [localSyncState, setLocalSyncState] = useState<CalendarSyncState | undefined>(
    syncState,
  );
  const [displaySyncedCount, setDisplaySyncedCount] = useState(
    syncState?.syncedEvents ?? 0,
  );
  const [heartbeat, setHeartbeat] = useState(0);
  const displaySyncedRef = useRef(syncState?.syncedEvents ?? 0);

  const isSyncing = localSyncStatus === "syncing";
  const isExperienceLive = loading || isSyncing;
  const showReconnectState = !isExperienceLive && hasCalendar && !authenticated;
  const showConnectedControls =
    !isExperienceLive &&
    completed &&
      !hasFailure &&
      hasCalendar &&
      authenticated &&
      calendarGranted;
  const compactConnectedStrip = variant === "connected-strip" && showConnectedControls;
  const showPrimaryAction = !isExperienceLive && !showConnectedControls;
  const canRemoveCalendar =
    !isExperienceLive && hasCalendar && authenticated && calendarGranted;
  const showAccountSummary =
    showReconnectState ||
    showConnectedControls ||
    (authenticated && !isExperienceLive && !showPrimaryAction);
  const totalMoments = localSyncState?.totalEvents ?? eventCount;
  const progressPercent = localSyncState
    ? Math.max(8, Math.round((displaySyncedCount / localSyncState.totalEvents) * 100))
    : Math.min(18, 8 + heartbeat);
  const stage = localSyncState?.stage ?? (isExperienceLive ? "creating_calendar" : "idle");
  const stageSummary = getStageSummary({
    stage,
    wakeTime,
    bedtimeTarget,
    sleepWindow,
    weekTitles,
  });
  const latestAdded = localSyncState?.recentTitles?.[0];
  const primaryLabel = getPrimaryButtonLabel({
    authConfigured,
    authenticated,
    calendarGranted,
    hasCalendar,
    hasFailure,
    loading,
  });

  const clearIntentQuery = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }

    const url = new URL(window.location.href);
    const hadIntent =
      url.searchParams.has("connect") || url.searchParams.has("deliver");

    if (!hadIntent) {
      return;
    }

    url.searchParams.delete("connect");
    url.searchParams.delete("deliver");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const resetBuildExperience = useCallback(() => {
    setLocalSyncState(undefined);
    setDisplaySyncedCount(0);
    displaySyncedRef.current = 0;
    setHeartbeat(0);
    setError(null);
  }, []);

  const applyDeliveryResponse = useCallback(
    async (response: Response) => {
      if (!response.ok) {
        throw new Error("Unable to connect");
      }

      const payload = (await response.json()) as {
        session?: {
          calendarSyncStatus?: CalendarSyncStatus;
          calendarSyncState?: CalendarSyncState;
          reportDeliveryStatus?: DeliveryStatus;
          status?: string;
        };
      };

      let resolvedStatus = syncStatus;

      setLocalSyncStatus((current) => {
        resolvedStatus = payload.session?.calendarSyncStatus ?? current;
        return resolvedStatus;
      });
      setLocalSyncState((current) => payload.session?.calendarSyncState ?? current);

      if (payload.session?.status === "completed" || resolvedStatus === "synced") {
        router.refresh();
      }
    },
    [router, syncStatus],
  );

  useEffect(() => {
    const target = localSyncState?.syncedEvents ?? 0;
    const start = displaySyncedRef.current;

    if (target <= start) {
      displaySyncedRef.current = target;
      setDisplaySyncedCount(target);
      return;
    }

    let frame = 0;
    const startedAt = performance.now();
    const duration = Math.min(1600, Math.max(500, (target - start) * 22));

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      const next = Math.round(start + (target - start) * eased);

      displaySyncedRef.current = next;
      setDisplaySyncedCount(next);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    };

    frame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [localSyncState?.syncedEvents]);

  useEffect(() => {
    if (!isExperienceLive || localSyncState) {
      return;
    }

    const interval = window.setInterval(() => {
      setHeartbeat((current) => Math.min(current + 1, 10));
    }, 700);

    return () => {
      window.clearInterval(interval);
    };
  }, [isExperienceLive, localSyncState]);

  const beginGoogleSignIn = useCallback(async () => {
    await signIn(
      "google",
      {
        redirectTo: `/report/${sessionId}?connect=1`,
      },
      {
        scope: "openid email profile",
      },
    );
  }, [sessionId]);

  const beginCalendarConnect = useCallback(
    async ({ forceConsent }: { forceConsent: boolean }) => {
      const authorizationParams: Record<string, string> = {
        access_type: "offline",
        response_type: "code",
        include_granted_scopes: "true",
        scope:
          "openid email profile https://www.googleapis.com/auth/calendar.app.created",
      };

      if (forceConsent) {
        authorizationParams.prompt = "consent";
      }

      await signIn(
        "google",
        {
          redirectTo: `/report/${sessionId}?deliver=1`,
        },
        authorizationParams,
      );
    },
    [sessionId],
  );

  const startDelivery = useCallback(async () => {
    const response = await fetch("/api/integrations/google/connect", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });

    await applyDeliveryResponse(response);
  }, [applyDeliveryResponse, sessionId]);

  useEffect(() => {
    if (!connectOnLoad || !authenticated || calendarGranted || completed) {
      return;
    }

    clearIntentQuery();
    setLoading(true);
    resetBuildExperience();

    void beginCalendarConnect({ forceConsent: false })
      .catch(() => {
        setError("We couldn't open the Google Calendar permission step yet.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    authenticated,
    calendarGranted,
    clearIntentQuery,
    completed,
    connectOnLoad,
    beginCalendarConnect,
    resetBuildExperience,
  ]);

  useEffect(() => {
    if (!deliverOnLoad || !authenticated || !calendarGranted || completed) {
      return;
    }

    clearIntentQuery();
    resetBuildExperience();

    void startDelivery()
      .catch(() => {
        setError("We couldn't finish adding your plan to Google Calendar yet.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    authenticated,
    calendarGranted,
    clearIntentQuery,
    completed,
    deliverOnLoad,
    resetBuildExperience,
    startDelivery,
  ]);

  useEffect(() => {
    if (!authenticated || !calendarGranted || localSyncStatus !== "syncing") {
      return;
    }

    let cancelled = false;
    let inFlight = false;

    const poll = async () => {
      if (cancelled || inFlight) {
        return;
      }

      inFlight = true;

      try {
        const response = await fetch("/api/integrations/google/connect", {
          method: "POST",
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });

        if (!cancelled) {
          await applyDeliveryResponse(response);
        }
      } catch {
        if (!cancelled) {
          setError("We lost track of the calendar build for a moment. You can retry.");
          setLocalSyncStatus("failed");
        }
      } finally {
        inFlight = false;
      }
    };

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [
    authenticated,
    applyDeliveryResponse,
    calendarGranted,
    localSyncStatus,
    sessionId,
  ]);

  if (compactConnectedStrip) {
    return (
      <section className="rounded-[24px] border border-[rgba(45,141,143,.16)] bg-[rgba(245,249,249,0.92)] px-4 py-4 shadow-[0_14px_30px_rgba(31,35,64,0.05)]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)]">
                <CheckCircle2 className="h-5 w-5 text-[color:var(--teal)]" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                  Google Calendar connected
                </p>
                <h2 className="mt-1 text-lg font-semibold leading-7 text-[color:var(--foreground)]">
                  Your plan can now live in Calendar
                </h2>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  Connected as {googleEmail ?? "your Google account"}. Calendar check-ins can keep this plan aligned with the nights you actually log.
                </p>
              </div>
            </div>
            <StatusPill tone="success">Connected</StatusPill>
          </div>

          <div className="flex flex-wrap gap-3">
            {canRemoveCalendar ? (
              <SecondaryActionButton
                busy={removing}
                icon={<Trash2 className="h-4 w-4" />}
                label={`Remove ${brandName} calendar`}
                onClick={() => {
                  setRemoving(true);
                  setError(null);

                  startTransition(() => {
                    void fetch("/api/integrations/google/connect", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId }),
                    })
                      .then(async (response) => {
                        const payload = (await response.json().catch(() => null)) as
                          | { deleteResult?: { status?: string } }
                          | null;

                        if (!response.ok || payload?.deleteResult?.status !== "deleted") {
                          throw new Error("Unable to remove calendar");
                        }
                        router.replace(`/report/${sessionId}`);
                        router.refresh();
                      })
                      .catch(() => {
                        setError(`We couldn't remove the ${brandName} calendar yet.`);
                      })
                      .finally(() => {
                        setRemoving(false);
                      });
                  });
                }}
              />
            ) : null}

            <SecondaryActionButton
              busy={reconnecting}
              icon={<Unplug className="h-4 w-4" />}
              label="Disconnect Google"
              onClick={() => {
                setReconnecting(true);
                setError(null);

                startTransition(() => {
                  void signOut({ redirect: false })
                    .then(() => {
                      router.replace(`/report/${sessionId}`);
                      router.refresh();
                    })
                    .catch(() => {
                      setError("We couldn't disconnect Google yet.");
                    })
                    .finally(() => {
                      setReconnecting(false);
                    });
                });
              }}
            />
          </div>

          {error ? (
            <p className="text-sm leading-6 text-[color:var(--accent-strong)]">{error}</p>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section
      className="editorial-card rounded-[28px] border border-[color:var(--line)] bg-white/88 p-5 shadow-[0_16px_36px_rgba(31,35,64,0.08)]"
      data-variant={variant ?? "default"}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)]">
              {showConnectedControls ? (
                <CheckCircle2 className="h-6 w-6 text-[color:var(--teal)]" />
              ) : isExperienceLive ? (
                <Sparkles className="h-6 w-6 text-[color:var(--accent-strong)]" />
              ) : (
                <CalendarDays className="h-6 w-6 text-[color:var(--teal)]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                {getEyebrow({
                  completed: showConnectedControls,
                  isExperienceLive,
                  authenticated,
                  calendarGranted,
                  hasCalendar,
                })}
              </p>
              <h2
                className={`mt-1 text-[color:var(--foreground)] ${
                  variant === "hero-cta"
                    ? "display text-[1.95rem] leading-[1.02] sm:text-[2.35rem]"
                    : "display text-[1.85rem] leading-[1.04] sm:text-2xl"
                }`}
              >
                {getHeading({
                  completed: showConnectedControls,
                  isExperienceLive,
                  authenticated,
                  calendarGranted,
                  hasCalendar,
                  hasFailure,
                })}
              </h2>
              <p className="mt-2 max-w-[34rem] text-sm leading-6 text-[color:var(--muted)]">
                {getBodyCopy({
                  completed: showConnectedControls,
                  isExperienceLive,
                  authenticated,
                  calendarGranted,
                  hasCalendar,
                  authConfigured,
                  hasFailure,
                  googleEmail,
                })}
              </p>
            </div>
          </div>
          <StatusPill
            tone={
              showConnectedControls
                ? "success"
                : hasFailure
                  ? "warning"
                  : isExperienceLive
                    ? "default"
                    : "muted"
            }
          >
            {showConnectedControls
              ? "Connected"
                : hasFailure
                  ? "Needs retry"
                  : isExperienceLive
                    ? "Building"
                    : showReconnectState
                      ? "Reconnect"
                      : authenticated && calendarGranted && hasCalendar
                        ? "Ready"
                        : authenticated
                          ? "One more step"
                          : "Optional"}
          </StatusPill>
        </div>

        {isExperienceLive ? (
          <div className="rounded-[22px] border border-[rgba(45,141,143,.18)] bg-[linear-gradient(145deg,rgba(45,141,143,.10),rgba(246,198,103,.14))] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  {localSyncState?.stageLabel ?? "Building your personal sleep plan"}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                  {localSyncState
                    ? `${displaySyncedCount} of ${totalMoments} calendar moments added`
                    : "Starting from your answers and building the calendar around them."}
                </p>
              </div>
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--accent-strong)]" />
            </div>
            <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-white/70">
              <div
                className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--yellow))] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 rounded-[18px] border border-white/85 bg-white/80 px-4 py-3">
              <p className="text-sm leading-6 text-[color:var(--foreground)]">
                {stageSummary}
              </p>
              {latestAdded ? (
                <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                  Latest addition: {latestAdded}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
                {reportStatus === "sent"
                  ? "Your report is already on its way while the calendar finishes here."
                  : "Your report and calendar can finish a few moments apart while this stays in motion."}
              </p>
            </div>
          </div>
        ) : null}

        {showAccountSummary ? (
          <div className="rounded-[22px] border border-[color:var(--line)] bg-[rgba(45,141,143,.05)] px-4 py-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                  Google account
                </p>
                <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                  {authenticated ? googleEmail ?? "Connected" : "Not connected yet"}
                </p>
                <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                  {showReconnectState
                    ? `A dedicated ${brandName} calendar already exists, but Google is not connected in this browser right now.`
                    : showConnectedControls || calendarGranted
                      ? `The dedicated ${brandName} calendar lives in this Google account.`
                      : "We only ask for Google Calendar access if you choose to add the plan."}
                </p>
              </div>

              {authenticated && !showConnectedControls && !isExperienceLive ? (
                <button
                  className="inline-flex items-center gap-2 self-start text-sm font-medium text-[color:var(--teal)] underline decoration-[rgba(45,141,143,.35)] decoration-2 underline-offset-4 transition hover:text-[color:var(--foreground)]"
                  type="button"
                  onClick={() => {
                    setReconnecting(true);
                    setError(null);

                    startTransition(() => {
                      void signOut({ redirect: false })
                        .then(() => beginGoogleSignIn())
                        .catch(() => {
                          setError("We couldn't restart Google sign-in yet.");
                        })
                        .finally(() => {
                          setReconnecting(false);
                        });
                    });
                  }}
                >
                  {reconnecting ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Use a different Google account
                </button>
              ) : null}
            </div>
          </div>
        ) : null}

        {showPrimaryAction ? (
          <div className="flex flex-col gap-3">
            <button
              className="panel-lift inline-flex items-center justify-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!authConfigured && !hasFailure}
              type="button"
              onClick={() => {
                if (!authConfigured) {
                  setError("Google auth is not configured in this environment yet.");
                  return;
                }

                setLoading(true);
                resetBuildExperience();

                startTransition(() => {
                  if (!authenticated) {
                    if (hasCalendar) {
                      void beginCalendarConnect({ forceConsent: false }).finally(() => {
                        setLoading(false);
                      });
                      return;
                    }

                    void beginGoogleSignIn().finally(() => {
                      setLoading(false);
                    });
                    return;
                  }

                  if (!calendarGranted) {
                    void beginCalendarConnect({ forceConsent: hasCalendar ? false : true }).finally(() => {
                      setLoading(false);
                    });
                    return;
                  }

                  void startDelivery()
                    .catch(() => {
                      setError("We couldn't finish adding your plan to Google Calendar yet.");
                    })
                    .finally(() => {
                      setLoading(false);
                    });
                });
              }}
            >
              {loading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              {primaryLabel}
            </button>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              {showReconnectState
                ? "Reconnect Google if you want to keep syncing this calendar or manage it from here."
                : "Google is optional. Connect it only if you want this plan on your calendar."}
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {canRemoveCalendar ? (
              <SecondaryActionButton
                busy={removing}
                icon={<Trash2 className="h-4 w-4" />}
                label={`Remove ${brandName} calendar`}
                onClick={() => {
                  setRemoving(true);
                  setError(null);

                  startTransition(() => {
                    void fetch("/api/integrations/google/connect", {
                      method: "DELETE",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ sessionId }),
                    })
                      .then(async (response) => {
                        const payload = (await response.json().catch(() => null)) as
                          | { deleteResult?: { status?: string } }
                          | null;

                        if (!response.ok || payload?.deleteResult?.status !== "deleted") {
                          throw new Error("Unable to remove calendar");
                        }
                        router.replace(`/report/${sessionId}`);
                        router.refresh();
                      })
                      .catch(() => {
                        setError(`We couldn't remove the ${brandName} calendar yet.`);
                      })
                      .finally(() => {
                        setRemoving(false);
                      });
                  });
                }}
              />
            ) : null}

            {showConnectedControls ? (
              <SecondaryActionButton
                busy={reconnecting}
                icon={<Unplug className="h-4 w-4" />}
                label="Disconnect Google"
                onClick={() => {
                  setReconnecting(true);
                  setError(null);

                  startTransition(() => {
                    void signOut({ redirect: false })
                      .then(() => {
                        router.replace(`/report/${sessionId}`);
                        router.refresh();
                      })
                      .catch(() => {
                        setError("We couldn't disconnect Google yet.");
                      })
                      .finally(() => {
                        setReconnecting(false);
                      });
                  });
                }}
              />
            ) : null}
          </div>
        )}

        {error ? (
          <p className="text-sm leading-6 text-[color:var(--accent-strong)]">{error}</p>
        ) : null}

        <p className="text-sm leading-6 text-[color:var(--muted)]">
          {appSupportPromise} Questions about Google access or removing your calendar? Contact{" "}
          <a
            href={supportMailto("RestShore Google calendar question")}
            className="font-medium text-[color:var(--foreground)] underline decoration-[color:var(--line)] underline-offset-4"
          >
            {supportEmail}
          </a>
          .
        </p>
      </div>
    </section>
  );
}

function StatusPill({
  tone,
  children,
}: {
  tone: "default" | "success" | "warning" | "muted";
  children: React.ReactNode;
}) {
  const classes =
    tone === "success"
      ? "border-[rgba(45,141,143,.22)] bg-[rgba(45,141,143,.12)] text-[color:var(--teal)]"
      : tone === "warning"
        ? "border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] text-[color:var(--accent-strong)]"
        : tone === "default"
          ? "border-[rgba(246,198,103,.28)] bg-[rgba(246,198,103,.18)] text-[color:var(--foreground)]"
          : "border-[color:var(--line)] bg-white/85 text-[color:var(--muted)]";

  return (
    <span
      className={`inline-flex self-start shrink-0 items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.14em] ${classes}`}
    >
      {children}
    </span>
  );
}

function SecondaryActionButton({
  busy,
  icon,
  label,
  onClick,
}: {
  busy: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className="panel-lift inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white/90 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
      type="button"
      onClick={onClick}
    >
      {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : icon}
      {label}
    </button>
  );
}

function getPrimaryButtonLabel({
  authConfigured,
  authenticated,
  calendarGranted,
  hasCalendar,
  hasFailure,
  loading,
}: {
  authConfigured: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  hasCalendar: boolean;
  hasFailure: boolean;
  loading: boolean;
}) {
  if (loading) {
    if (authenticated && !calendarGranted) {
      return "Opening Google Calendar access...";
    }

    return "Starting your calendar setup...";
  }

  if (!authConfigured) {
    return "Google setup is not ready yet";
  }

  if (hasFailure) {
    return "Retry adding your plan to Calendar";
  }

  if (!authenticated && hasCalendar) {
    return "Reconnect Google to manage your calendar";
  }

  if (!authenticated) {
    return "Connect with Google to add your plan to Calendar";
  }

  if (!calendarGranted) {
    return "Continue to Google Calendar access";
  }

  return "Add your plan to Calendar";
}

function getEyebrow({
  completed,
  isExperienceLive,
  authenticated,
  calendarGranted,
  hasCalendar,
}: {
  completed: boolean;
  isExperienceLive: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  hasCalendar: boolean;
}) {
  if (completed) {
    return "Calendar connected";
  }

  if (isExperienceLive) {
    return "Google Calendar";
  }

  if (!authenticated && hasCalendar) {
    return "Reconnect to manage";
  }

  if (authenticated && calendarGranted) {
    return "Ready to add";
  }

  return "Optional next step";
}

function getHeading({
  completed,
  isExperienceLive,
  authenticated,
  calendarGranted,
  hasCalendar,
  hasFailure,
}: {
  completed: boolean;
  isExperienceLive: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  hasCalendar: boolean;
  hasFailure: boolean;
}) {
  if (completed) {
    return "Your plan is now live in Google Calendar";
  }

  if (isExperienceLive) {
    return "We are building your calendar now";
  }

  if (hasFailure) {
    return "Finish adding the plan to Google Calendar";
  }

  if (!authenticated && hasCalendar) {
    return "Reconnect Google to manage your calendar";
  }

  if (authenticated && !calendarGranted) {
    return "Give RestShore Calendar access";
  }

  if (authenticated && calendarGranted) {
    return "Add this plan to Google Calendar";
  }

  return "Add this plan to Google Calendar";
}

function getBodyCopy({
  completed,
  isExperienceLive,
  authenticated,
  calendarGranted,
  hasCalendar,
  authConfigured,
  hasFailure,
  googleEmail,
}: {
  completed: boolean;
  isExperienceLive: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  hasCalendar: boolean;
  authConfigured: boolean;
  hasFailure: boolean;
  googleEmail?: string | null;
}) {
  if (completed) {
    return "Your wake anchor, sleep window, sleep log, and future updates can now live in one dedicated RestShore calendar.";
  }

  if (isExperienceLive) {
    return "Stay here if you want to watch the plan come together, or come back in a moment. We will keep using the same dedicated calendar while it builds.";
  }

  if (!authConfigured) {
    return "Google connection is not configured in this environment yet, so the live calendar step is unavailable here.";
  }

  if (hasFailure) {
    return "Google connected, but the calendar build did not finish cleanly. Retry from here and we will continue using the same dedicated calendar.";
  }

  if (!authenticated && hasCalendar) {
    return "Your plan already lives in a dedicated RestShore calendar. Sign in again if you want to keep syncing it or remove it.";
  }

  if (authenticated && !calendarGranted) {
    return `You are signed in as ${googleEmail ?? "your Google account"}. We only ask for one extra permission so we can create and manage the dedicated RestShore calendar, not your main calendar.`;
  }

  if (authenticated && calendarGranted) {
    return `You are signed in as ${googleEmail ?? "your Google account"}. Add the plan now, then let future check-ins keep that calendar aligned with your sleep.`;
  }

  return "Put your plan on a dedicated calendar so it is easier to follow and future check-ins can keep it updated.";
}

function getStageSummary({
  stage,
  wakeTime,
  bedtimeTarget,
  sleepWindow,
  weekTitles,
}: {
  stage: CalendarSyncStage | "idle";
  wakeTime: string;
  bedtimeTarget: string;
  sleepWindow: string;
  weekTitles: string[];
}) {
  switch (stage) {
    case "creating_calendar":
      return `Based on your answers, we’re setting a wake anchor of ${wakeTime}, an initial bedtime target of ${bedtimeTarget}, and a ${sleepWindow} starting sleep window.`;
    case "laying_foundation":
      return "Placing the daytime anchors that make the whole plan easier to follow in real life.";
    case "building_evening_routine":
      return "Adding the calmer evening cues that help bedtime feel more followable and less effortful.";
    case "building_sleep_window":
      return "Adding your sleep window, in-bed guidance, and what to do if sleep is slow or broken.";
    case "adding_coach_notes":
      return `Layering in the week-by-week structure, starting with ${weekTitles[0] ?? "Week 1"}.`;
    case "wrapping_up":
      return "Finishing the calendar so the plan is ready to live in your week, not just on this page.";
    case "complete":
      return "Your dedicated calendar is ready.";
    default:
      return "Preparing the calendar version of your plan.";
  }
}
