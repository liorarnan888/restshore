"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, LoaderCircle, MailCheck, Sparkles } from "lucide-react";
import { signIn, signOut } from "next-auth/react";

import { appSupportPromise, betaLabel, brandName } from "@/lib/brand";
import type { CalendarSyncState, CalendarSyncStatus, DeliveryStatus } from "@/lib/types";

export function GoogleConnectCard({
  sessionId,
  completed,
  authenticated,
  calendarGranted,
  canRemoveCalendar,
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
}: {
  sessionId: string;
  completed: boolean;
  authenticated: boolean;
  calendarGranted: boolean;
  canRemoveCalendar: boolean;
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
}) {
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
  const [messageIndex, setMessageIndex] = useState(0);
  const [heartbeat, setHeartbeat] = useState(0);
  const displaySyncedRef = useRef(syncState?.syncedEvents ?? 0);

  const isSyncing = localSyncStatus === "syncing";
  const isExperienceLive = loading || isSyncing;
  const hasMeasuredProgress = Boolean(localSyncState);
  const totalMoments = localSyncState?.totalEvents ?? eventCount;
  const displayProgressPercent = localSyncState
    ? Math.max(6, Math.round((displaySyncedCount / localSyncState.totalEvents) * 100))
    : Math.min(14, 4 + heartbeat);
  const weekProgressCount = localSyncState
    ? Math.max(
        1,
        Math.min(
          6,
          Math.ceil((displaySyncedCount / Math.max(localSyncState.totalEvents, 1)) * 6),
        ),
      )
    : 0;
  const experiencePhase =
    localSyncState?.stage ?? (isExperienceLive ? "creating_calendar" : "idle");
  const buildTracks = [
    {
      key: "profile",
      eyebrow: "Sleep blueprint",
      detail: `Wake ${wakeTime}, bedtime ${bedtimeTarget}, ${sleepWindow} sleep window`,
      active:
        experiencePhase === "creating_calendar" ||
        experiencePhase === "laying_foundation",
    },
    {
      key: "day",
      eyebrow: "Daytime anchors",
      detail: "Light, meal timing, caffeine, naps, and daytime movement",
      active: experiencePhase === "laying_foundation",
    },
    {
      key: "night",
      eyebrow: "Night routine",
      detail: "Digital sunset, wind-down, in-bed rescue, and sleep window cues",
      active:
        experiencePhase === "building_evening_routine" ||
        experiencePhase === "building_sleep_window",
    },
    {
      key: "weeks",
      eyebrow: "6-week arc",
      detail: "Weekly focus, setbacks, recovery, and CBT-I coaching logic",
      active:
        experiencePhase === "adding_coach_notes" ||
        experiencePhase === "wrapping_up" ||
        experiencePhase === "complete",
    },
  ];
  const narrationSequence =
    experiencePhase === "creating_calendar"
      ? [
          "Building your personal sleep plan from the patterns you shared.",
          `Setting your wake anchor around ${wakeTime} and mapping your first sleep window.`,
          "Preparing a calmer structure for your nights, mornings, and recovery after rough sleep.",
        ]
      : experiencePhase === "laying_foundation"
        ? [
            "Laying in the daytime anchors that will support better sleep tonight.",
            "Placing morning light, meals, caffeine, movement, and nap boundaries into your plan.",
            "Turning your answers into a rhythm your body can start learning.",
          ]
        : experiencePhase === "building_evening_routine"
          ? [
              "Preparing the evening cues that help your body stop treating bedtime like work.",
              "Adding wind-down steps, lower-stimulation cues, and calmer transitions into your night.",
              "Personalizing the last stretch of the day so it feels quieter, smaller, and easier to follow.",
            ]
          : experiencePhase === "building_sleep_window"
            ? [
                `Building your protected ${sleepWindow} sleep window around ${bedtimeTarget}.`,
                "Adding clear guidance for what to do if sleep is slow to arrive.",
                "Adding overnight rescue guidance for wake-ups, frustration, and returning to bed.",
              ]
            : experiencePhase === "adding_coach_notes" ||
                experiencePhase === "wrapping_up"
              ? [
                  "Layering in the week-by-week coaching that will carry you through all 6 weeks.",
                  "Adding practical reminders for setbacks, weekends, and nights that do not go to plan.",
                  `Finishing with a clear Week 1 starting point: ${weekTitles[0] ?? "Stabilize the runway"}.`,
                ]
              : [`Putting the final touches on your personal ${brandName} calendar.`];
  const currentNarration =
    narrationSequence[Math.min(messageIndex, narrationSequence.length - 1)];
  const milestoneCards = [
    {
      key: "profile",
      title: "Sleep blueprint",
      detail: `Wake ${wakeTime}, bedtime ${bedtimeTarget}, and a ${sleepWindow} sleep window.`,
      done:
        experiencePhase !== "creating_calendar" &&
        experiencePhase !== "idle",
      active: experiencePhase === "creating_calendar",
    },
    {
      key: "anchors",
      title: "Daytime anchors",
      detail: "Morning light, meal timing, caffeine, naps, and movement.",
      done:
        ["building_evening_routine", "building_sleep_window", "adding_coach_notes", "wrapping_up", "complete"].includes(
          experiencePhase,
        ),
      active: experiencePhase === "laying_foundation",
    },
    {
      key: "evening",
      title: "Evening descent",
      detail: "Digital sunset, wind-down, and lower-arousal cues before bed.",
      done:
        ["building_sleep_window", "adding_coach_notes", "wrapping_up", "complete"].includes(
          experiencePhase,
        ),
      active: experiencePhase === "building_evening_routine",
    },
    {
      key: "window",
      title: "Sleep window and rescue",
      detail: "Sleep timing plus what to do if sleep does not come or breaks.",
      done:
        ["adding_coach_notes", "wrapping_up", "complete"].includes(
          experiencePhase,
        ),
      active: experiencePhase === "building_sleep_window",
    },
    {
      key: "weeks",
      title: "6-week coaching arc",
      detail: "Weekly focus, setbacks, and a shareable structure you can revisit.",
      done: experiencePhase === "complete",
      active:
        experiencePhase === "adding_coach_notes" ||
        experiencePhase === "wrapping_up",
    },
  ];

  const resetBuildExperience = useCallback(() => {
    setLocalSyncState(undefined);
    setDisplaySyncedCount(0);
    displaySyncedRef.current = 0;
    setHeartbeat(0);
    setMessageIndex(0);
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
    const duration = Math.min(1800, Math.max(600, (target - start) * 24));

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
    setMessageIndex(0);
  }, [experiencePhase]);

  useEffect(() => {
    if (!isExperienceLive || narrationSequence.length <= 1) {
      return;
    }

    const interval = window.setInterval(() => {
      setMessageIndex((current) =>
        Math.min(current + 1, narrationSequence.length - 1),
      );
    }, 2200);

    return () => {
      window.clearInterval(interval);
    };
  }, [isExperienceLive, narrationSequence.length]);

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

  const beginCalendarConnect = useCallback(async () => {
    await signIn(
      "google",
      {
        redirectTo: `/report/${sessionId}?deliver=1`,
      },
      {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
        include_granted_scopes: "true",
        scope:
          "openid email profile https://www.googleapis.com/auth/calendar.app.created",
      },
    );
  }, [sessionId]);

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

    setLoading(true);
    resetBuildExperience();

    void beginCalendarConnect()
      .catch(() => {
        setError("We couldn't open the calendar permission step yet.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    authenticated,
    calendarGranted,
    completed,
    connectOnLoad,
    beginCalendarConnect,
    resetBuildExperience,
  ]);

  useEffect(() => {
    if (!deliverOnLoad || !authenticated || !calendarGranted || completed) {
      return;
    }

    resetBuildExperience();

    void startDelivery()
      .catch(() => {
        setError("We couldn't complete the calendar sync yet.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [
    authenticated,
    calendarGranted,
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
          setError("We lost track of the calendar sync for a moment. You can retry.");
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

  if (completed) {
    return (
      <div className="editorial-card rounded-[28px] border border-[rgba(45,141,143,.18)] p-5">
        <div className="flex items-center gap-3 text-[color:var(--foreground)]">
          <MailCheck className="h-5 w-5 text-[color:var(--teal)]" />
          <div>
            <p className="font-medium">
              Your {brandName} calendar is already connected.
            </p>
            <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
              You can leave it as-is, or remove the dedicated calendar from here at any time.
            </p>
            {canRemoveCalendar ? (
              <div className="mt-3 flex flex-wrap gap-3">
                <button
                  className="panel-lift inline-flex items-center gap-2 rounded-full border border-[rgba(45,141,143,.22)] bg-white/85 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                  type="button"
                  onClick={() => {
                    setRemoving(true);
                    setError(null);

                    startTransition(() => {
                      void fetch("/api/integrations/google/connect", {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ sessionId }),
                      })
                        .then((response) => {
                          if (!response.ok) {
                            throw new Error("Unable to remove calendar");
                          }
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
                >
                  {removing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  Remove {brandName} calendar
                </button>
                {authenticated ? (
                  <button
                    className="panel-lift inline-flex items-center gap-2 rounded-full border border-[rgba(45,141,143,.22)] bg-white/85 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                    type="button"
                    onClick={() => {
                      setReconnecting(true);
                      setError(null);

                      startTransition(() => {
                        void signOut({ redirect: false })
                          .then(() => {
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
                  >
                    {reconnecting ? (
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                    ) : null}
                    Disconnect Google
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
        {error ? (
          <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{error}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="editorial-card rounded-[28px] border border-[color:var(--line)] p-6 shadow-[0_16px_36px_rgba(31,35,64,0.08)]">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)]">
          <CalendarDays className="h-6 w-6 text-[color:var(--teal)]" />
        </div>
        <div>
          <p className="display text-2xl text-[color:var(--foreground)]">
            Add your {brandName} calendar
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            {isExperienceLive
              ? `We are turning your answers into a ${betaLabel.toLowerCase()} calendar you can actually follow. One app tap starts the flow, then Google opens the next permission step automatically.`
              : hasFailure
              ? `Google connected, but the calendar sync did not finish cleanly. Retry from here and we will keep using the same dedicated ${brandName} calendar.`
              : authConfigured
                ? calendarGranted
                  ? `We only manage the ${brandName} calendar we create here. We do not touch your main Google Calendar.`
                  : authenticated
                  ? "Google is already signed in. One tap opens calendar access automatically and then we build the calendar here."
                  : "One tap signs you in, then Google opens calendar access automatically and we build the calendar here."
              : "Google auth is not configured yet, so this button will stay in preview mode until credentials are added."}
          </p>
        </div>
      </div>

      {isExperienceLive ? (
        <div className="mt-5 rounded-[24px] border border-[rgba(45,141,143,.18)] bg-[linear-gradient(145deg,rgba(45,141,143,.10),rgba(246,198,103,.14))] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                Creating your calendar
              </p>
              <p className="mt-2 display text-2xl text-[color:var(--foreground)]">
                {localSyncState?.stageLabel ?? "Building and personalizing your sleep plan"}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                {localSyncState
                ? `${displaySyncedCount} of ${totalMoments} moments added`
                  : "Preparing your personalized blueprint, week structure, and calendar logic"}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/75">
              <Sparkles className="h-5 w-5 text-[color:var(--accent-strong)]" />
            </div>
          </div>
          <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/70">
            <div
              className="relative h-3 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--yellow))] transition-all"
              style={{ width: `${displayProgressPercent}%` }}
            />
          </div>
          <div className="mt-4 rounded-[20px] border border-white/85 bg-white/80 px-4 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Personalizing Right Now
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
              {currentNarration}
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {buildTracks.map((track) => (
              <div
                key={track.key}
                className={`rounded-[18px] border px-4 py-3 transition ${
                  track.active
                    ? "border-[rgba(235,93,52,.22)] bg-white text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(235,93,52,.10)]"
                    : "border-white/80 bg-white/65 text-[color:var(--muted)]"
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em]">
                  {track.active ? "Active now" : "Coming through"}
                </p>
                <p className="mt-2 text-sm font-medium">{track.eyebrow}</p>
                <p className="mt-1 text-xs leading-5">{track.detail}</p>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Your 6-Week Arc
            </p>
            <div className="mt-2 grid grid-cols-6 gap-2">
              {Array.from({ length: 6 }).map((_, index) => {
                const active = index < weekProgressCount;
                return (
                  <div
                    key={index}
                    className={`rounded-[16px] border px-2 py-2 text-center text-[11px] font-medium uppercase tracking-[0.12em] transition ${
                      active
                        ? "border-[rgba(45,141,143,.24)] bg-white text-[color:var(--foreground)]"
                        : hasMeasuredProgress
                          ? "border-white/75 bg-white/55 text-[color:var(--muted)]"
                          : "border-white/65 bg-transparent text-[color:var(--muted)]/80"
                    }`}
                  >
                    W{index + 1}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {milestoneCards.map((milestone) => (
              <div
                key={milestone.key}
                className={`rounded-[18px] border px-4 py-3 text-sm transition ${
                  milestone.active
                    ? "border-[rgba(235,93,52,.22)] bg-white text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(235,93,52,.10)]"
                    : milestone.done
                      ? "border-[rgba(45,141,143,.18)] bg-white/88 text-[color:var(--foreground)]"
                      : "border-white/80 bg-white/72 text-[color:var(--muted)]"
                }`}
              >
                <p className="text-[11px] font-medium uppercase tracking-[0.16em]">
                  {milestone.active
                    ? "Live now"
                    : milestone.done
                      ? "Ready"
                      : "Queued"}
                </p>
                <p className="mt-2 font-medium">{milestone.title}</p>
                <p className="mt-1 text-xs leading-5">{milestone.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
            Your plan is coming together now: morning anchors, evening downshift, a protected sleep window, overnight rescue steps, and a six-week coaching structure.
          </p>
        </div>
      ) : null}

        {isSyncing ? (
          <div className="mt-4 grid gap-3 text-sm text-[color:var(--foreground)]">
            <div className="rounded-[20px] border border-[color:var(--line)] bg-white/75 px-4 py-3">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                Calendar account
              </p>
              <p className="mt-1 leading-6">
                <span className="font-medium">
                  {authenticated ? googleEmail ?? "Connected" : "Not connected yet"}
                </span>
              </p>
            </div>
          </div>
      ) : (
        <div className="mt-4 grid gap-3 text-sm text-[color:var(--foreground)]">
          <div className="rounded-[20px] border border-[color:var(--line)] bg-white/75 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
              Calendar account
            </p>
            <p className="mt-1 font-medium">
              {authenticated ? googleEmail ?? "Connected" : "Not connected yet"}
            </p>
            <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
              {calendarGranted
                ? `The dedicated ${brandName} calendar will live in this Google account.`
                : "You can switch accounts if needed."}
            </p>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
        <span className="rounded-full border border-[color:var(--line)] bg-white/80 px-3 py-1.5">
          Dedicated calendar only
        </span>
        <span className="rounded-full border border-[color:var(--line)] bg-white/80 px-3 py-1.5">
          {betaLabel}
        </span>
      </div>

      {!isSyncing ? (
        <button
          className="panel-lift mt-6 inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
          type="button"
          onClick={() => {
            setLoading(true);
            resetBuildExperience();

            startTransition(() => {
              if (authConfigured && !authenticated) {
                void beginGoogleSignIn().finally(() => {
                  setLoading(false);
                });
                return;
              }

              if (authConfigured && authenticated && !calendarGranted) {
                void beginCalendarConnect().finally(() => {
                  setLoading(false);
                });
                return;
              }

              void startDelivery()
                .catch(() => {
                  setError("We couldn't complete the calendar sync yet.");
                })
                .finally(() => {
                  setLoading(false);
                });
            });
          }}
        >
          {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
          {loading
            ? authenticated && !calendarGranted
              ? "Opening calendar access..."
              : "Starting your calendar sync..."
            : hasFailure
              ? "Retry calendar sync"
              : authConfigured && !authenticated
                ? "Continue with Google"
                : authConfigured && !calendarGranted
                  ? "Open calendar access"
                  : "Create my calendar and send my report"}
        </button>
      ) : (
        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[rgba(45,141,143,.2)] bg-white/85 px-4 py-2 text-sm font-medium text-[color:var(--foreground)]">
          <LoaderCircle className="h-4 w-4 animate-spin text-[color:var(--accent-strong)]" />
          Creating your calendar now
        </div>
      )}

      {(loading || isSyncing) &&
      authConfigured &&
      authenticated &&
      calendarGranted ? (
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          {reportStatus === "sent"
            ? "Your report is already on its way. Your calendar is still being assembled here."
            : "Your report and calendar can finish a few moments apart. The calendar will keep assembling here while you watch."}
        </p>
      ) : null}

      {authConfigured && authenticated && !completed && !isExperienceLive ? (
        <button
          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[color:var(--teal)] underline decoration-[rgba(45,141,143,.35)] decoration-2 underline-offset-4 transition hover:text-[color:var(--foreground)]"
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

      {error ? (
        <p className="mt-4 text-sm text-[color:var(--accent-strong)]">{error}</p>
      ) : null}

      <p className="mt-4 text-sm leading-6 text-[color:var(--muted)]">
        {appSupportPromise}
      </p>
    </div>
  );
}
