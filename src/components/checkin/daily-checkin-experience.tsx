"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Clock3, LoaderCircle, MoonStar } from "lucide-react";

import { BetaFeedbackCard } from "@/components/launch/beta-feedback-card";
import {
  normalizeDailyCheckInDraft,
  type DailyCheckInDraftSnapshot,
} from "@/lib/daily-checkin";
import type { AdaptivePlanSummaryItem, DailySleepCheckIn } from "@/lib/types";
import { cn } from "@/lib/utils";

type RequestState = "loading" | "idle" | "saving" | "saved" | "error";

type DraftDefaults = {
  nightDate: string;
  nightLabel: string;
  sleepEventId: string;
  checkInEventId: string;
  sleepEventStartsAt: string;
  sleepEventEndsAt: string;
  plannedBedtime: string;
  plannedWakeTime: string;
  plannedBedtimeLabel: string;
  plannedWakeTimeLabel: string;
  existingEntry?: DailySleepCheckIn | null;
};

type DailyCheckInDraft = DailyCheckInDraftSnapshot;

type StartPayload = {
  draftDefaults: DraftDefaults;
};

type CheckInStep =
  | {
      id: keyof DailyCheckInDraft;
      type: "time";
      title: string;
      helper: string;
    }
  | {
      id: keyof DailyCheckInDraft;
      type: "single-select";
      title: string;
      helper: string;
      options: Array<{
        value: string;
        label: string;
      }>;
    };

type SubmitPayload = {
  sleepEvent?: {
    title: string;
    description: string;
  } | null;
  adaptiveSummary?: AdaptivePlanSummaryItem[];
};

const storageKey = (sessionId: string, nightDate: string) =>
  `sleep-compass-checkin:${sessionId}:${nightDate}`;

async function postJson<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

function draftFromEntry(
  entry: DailySleepCheckIn | null | undefined,
  defaults: DraftDefaults,
): DailyCheckInDraft {
  return {
    closenessToPlan: entry?.closenessToPlan ?? "",
    actualInBedTime: entry?.actualInBedTime ?? defaults.plannedBedtime,
    actualOutOfBedTime: entry?.actualOutOfBedTime ?? defaults.plannedWakeTime,
    nightPattern: entry?.nightPattern ?? "",
    sleepLatencyBucket: entry?.sleepLatencyBucket,
    awakeDuringNightBucket: entry?.awakeDuringNightBucket,
    awakeningsBucket: entry?.awakeningsBucket,
    earlyWakeBucket: entry?.earlyWakeBucket,
    morningFunction: entry?.morningFunction ?? "",
  };
}

function isDraftComplete(draft: DailyCheckInDraft) {
  if (
    !draft.closenessToPlan ||
    !draft.actualInBedTime ||
    !draft.actualOutOfBedTime ||
    !draft.nightPattern ||
    !draft.morningFunction
  ) {
    return false;
  }

  if (
    (draft.nightPattern === "slow_sleep" || draft.nightPattern === "rough_mix") &&
    !draft.sleepLatencyBucket
  ) {
    return false;
  }

  if (
    (draft.nightPattern === "several_wakeups" || draft.nightPattern === "rough_mix") &&
    (!draft.awakeDuringNightBucket || !draft.awakeningsBucket)
  ) {
    return false;
  }

  if (
    (draft.nightPattern === "early_wake" || draft.nightPattern === "rough_mix") &&
    !draft.earlyWakeBucket
  ) {
    return false;
  }

  return true;
}

function buildSteps(draft: DailyCheckInDraft): CheckInStep[] {
  const steps: CheckInStep[] = [
    {
      id: "closenessToPlan",
      type: "single-select" as const,
      title: "How close was last night to the plan?",
      helper:
        "Give your overall sense first. The actual times come next.",
      options: [
        { value: "close_to_plan", label: "Close to plan" },
        { value: "bedtime_later", label: "Bedtime was later than planned" },
        { value: "wake_drifted", label: "Wake time drifted" },
        { value: "both_drifted", label: "Both drifted" },
        { value: "hard_to_say", label: "Hard to say" },
      ],
    },
    {
      id: "actualInBedTime",
      type: "time" as const,
      title: "About what time did you get into bed?",
      helper: "Use your best estimate. Precision matters less than honesty here.",
    },
    {
      id: "actualOutOfBedTime",
      type: "time" as const,
      title: "About what time did you get out of bed for the day?",
      helper: "This is the time you got out of bed for good, not just the first awakening.",
    },
    {
      id: "nightPattern",
      type: "single-select" as const,
      title: "What best describes the night?",
      helper: "Pick the closest fit. We only branch when the answer changes the coaching.",
      options: [
        { value: "fell_asleep_quickly", label: "I fell asleep fairly quickly" },
        { value: "slow_sleep", label: "It took a while to fall asleep" },
        { value: "several_wakeups", label: "I woke up several times" },
        { value: "early_wake", label: "I woke too early" },
        { value: "rough_mix", label: "It was a rough mix of the above" },
      ],
    },
  ];

  if (draft.nightPattern === "slow_sleep" || draft.nightPattern === "rough_mix") {
    steps.push({
      id: "sleepLatencyBucket",
      type: "single-select" as const,
      title: "About how long did it take to fall asleep?",
      helper: "Choose the closest range.",
      options: [
        { value: "under_20", label: "Under 20 minutes" },
        { value: "20_40", label: "20 to 40 minutes" },
        { value: "40_60", label: "40 to 60 minutes" },
        { value: "over_60", label: "More than an hour" },
      ],
    });
  }

  if (draft.nightPattern === "several_wakeups" || draft.nightPattern === "rough_mix") {
    steps.push(
      {
        id: "awakeDuringNightBucket",
        type: "single-select" as const,
        title: "About how much total time were you awake during the night?",
        helper: "This is total awake time after sleep first began.",
        options: [
          { value: "under_20", label: "Under 20 minutes" },
          { value: "20_40", label: "20 to 40 minutes" },
          { value: "40_60", label: "40 to 60 minutes" },
          { value: "over_60", label: "More than an hour" },
        ],
      },
      {
        id: "awakeningsBucket",
        type: "single-select" as const,
        title: "How many awakenings do you remember?",
        helper: "Use your best estimate.",
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3_4", label: "3 to 4" },
          { value: "5_plus", label: "5 or more" },
        ],
      },
    );
  }

  if (draft.nightPattern === "early_wake" || draft.nightPattern === "rough_mix") {
    steps.push({
      id: "earlyWakeBucket",
      type: "single-select" as const,
      title: "About how much earlier did you wake than you wanted?",
      helper: "This is about the final early wake, not each small awakening.",
      options: [
        { value: "under_30", label: "Under 30 minutes" },
        { value: "30_60", label: "30 to 60 minutes" },
        { value: "60_90", label: "60 to 90 minutes" },
        { value: "over_90", label: "More than 90 minutes" },
      ],
    });
  }

  steps.push({
    id: "morningFunction",
    type: "single-select" as const,
    title: "How are you functioning this morning?",
    helper: "This helps us avoid overreacting to one rough night.",
    options: [
      { value: "good_enough", label: "Good enough" },
      { value: "tired_but_manageable", label: "Tired but manageable" },
      { value: "running_on_fumes", label: "Running on fumes" },
    ],
  });

  return steps;
}

export function DailyCheckInExperience({
  sessionId,
  nightDate,
  token,
  initialDraftDefaults,
  initialError,
}: {
  sessionId: string;
  nightDate: string;
  token: string;
  initialDraftDefaults?: DraftDefaults | null;
  initialError?: string | null;
}) {
  const [requestState, setRequestState] = useState<RequestState>(() => {
    if (initialDraftDefaults) {
      return "idle";
    }

    return initialError ? "error" : "loading";
  });
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [draftDefaults, setDraftDefaults] = useState<DraftDefaults | null>(
    initialDraftDefaults ?? null,
  );
  const [draft, setDraft] = useState<DailyCheckInDraft | null>(() =>
    initialDraftDefaults
      ? draftFromEntry(
          initialDraftDefaults.existingEntry,
          initialDraftDefaults,
        )
      : null,
  );
  const [currentStepId, setCurrentStepId] = useState<string>("closenessToPlan");
  const [savedSleepTitle, setSavedSleepTitle] = useState<string | null>(null);
  const [adaptiveSummary, setAdaptiveSummary] = useState<AdaptivePlanSummaryItem[]>([]);

  useEffect(() => {
    if (initialDraftDefaults || initialError) {
      return;
    }

    let active = true;

    const load = async () => {
      if (!token) {
        setRequestState("error");
        setError("This check-in link is missing its validation token.");
        return;
      }

      setRequestState("loading");
      setError(null);

      try {
        const payload = await postJson<StartPayload>("/api/check-ins/start", {
          sessionId,
          nightDate,
          token,
        });

        if (!active) {
          return;
        }

        const storedDraft =
          typeof window !== "undefined"
            ? window.localStorage.getItem(storageKey(sessionId, nightDate))
            : null;
        const parsedStoredDraft = storedDraft
          ? (JSON.parse(storedDraft) as Partial<DailyCheckInDraft>)
          : null;
        const nextDefaults = payload.draftDefaults;
        const nextDraft = payload.draftDefaults.existingEntry
          ? draftFromEntry(payload.draftDefaults.existingEntry, nextDefaults)
          : {
              ...draftFromEntry(undefined, nextDefaults),
              ...parsedStoredDraft,
            };

        const normalizedDraft = normalizeDailyCheckInDraft(nextDraft);

        setDraftDefaults(nextDefaults);
        setDraft(normalizedDraft);
        setCurrentStepId(buildSteps(normalizedDraft)[0]?.id ?? "closenessToPlan");
        setRequestState("idle");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setRequestState("error");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "We couldn't load this sleep check-in.",
        );
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [initialDraftDefaults, initialError, nightDate, sessionId, token]);

  useEffect(() => {
    if (!draft) {
      return;
    }

    window.localStorage.setItem(
      storageKey(sessionId, nightDate),
      JSON.stringify(normalizeDailyCheckInDraft(draft)),
    );
  }, [draft, nightDate, sessionId]);

  const steps = useMemo(() => (draft ? buildSteps(draft) : []), [draft]);
  const currentIndex = Math.max(
    steps.findIndex((step) => step.id === currentStepId),
    0,
  );
  const currentStep = steps[currentIndex];
  const progress = steps.length ? ((currentIndex + 1) / steps.length) * 100 : 0;

  function updateDraft<K extends keyof DailyCheckInDraft>(
    key: K,
    value: DailyCheckInDraft[K],
  ) {
    setDraft((currentDraft) => (currentDraft ? { ...currentDraft, [key]: value } : currentDraft));
  }

  function goBack() {
    if (!currentIndex) {
      return;
    }

    setCurrentStepId(steps[currentIndex - 1].id);
  }

  function goForward() {
    const nextStep = steps[currentIndex + 1];

    if (!nextStep) {
      return;
    }

    setCurrentStepId(nextStep.id);
  }

  function handleSingleSelect(stepId: keyof DailyCheckInDraft, value: string) {
    if (!draft) {
      return;
    }

    const nextDraft = {
      ...draft,
      [stepId]: value,
    } as DailyCheckInDraft;
    const normalizedDraft = normalizeDailyCheckInDraft(nextDraft);
    const nextSteps = buildSteps(normalizedDraft);
    const currentInNext = Math.max(
      nextSteps.findIndex((step) => step.id === stepId),
      0,
    );
    const isLastStep = currentInNext === nextSteps.length - 1;

    setDraft(normalizedDraft);

    if (isLastStep) {
      void handleSubmit(normalizedDraft);
      return;
    }

    const nextStep = nextSteps[currentInNext + 1];

    if (nextStep) {
      setCurrentStepId(nextStep.id);
    }
  }

  async function handleSubmit(nextDraft = draft) {
    if (!nextDraft || !draftDefaults || !isDraftComplete(nextDraft)) {
      return;
    }

    setRequestState("saving");
    setError(null);

    try {
      const payload = await postJson<SubmitPayload>("/api/check-ins/submit", {
        sessionId,
        nightDate,
        token,
        entry: nextDraft,
      });

      window.localStorage.removeItem(storageKey(sessionId, nightDate));
      setSavedSleepTitle(payload.sleepEvent?.title ?? "Sleep");
      setAdaptiveSummary(payload.adaptiveSummary ?? []);
      setRequestState("saved");
    } catch (submitError) {
      setRequestState("error");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't save your sleep log yet.",
      );
    }
  }

  if (requestState === "error" && (!draft || !draftDefaults)) {
    return (
      <section className="glass-panel mx-auto w-full max-w-3xl rounded-[36px] border border-white/70 p-6 sm:p-8">
        <div className="rounded-[28px] border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] p-6">
          <h1 className="display text-3xl text-[color:var(--foreground)]">
            We could not open this sleep check-in.
          </h1>
          <p className="mt-3 text-sm leading-7 text-[color:var(--foreground)]">
            {error ?? "This link may be invalid, expired, or tied to a night that is not ready yet."}
          </p>
          <Link
            href={`/report/${sessionId}`}
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
          >
            Back to report
          </Link>
        </div>
      </section>
    );
  }

  if (requestState === "loading" || !draft || !draftDefaults || !currentStep) {
    return (
      <section className="glass-panel mx-auto flex min-h-[560px] w-full max-w-3xl items-center justify-center rounded-[36px] border border-white/70 p-8">
        <div className="max-w-md text-center text-[color:var(--muted)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/85 shadow-[0_12px_24px_rgba(31,35,64,0.08)]">
            <LoaderCircle className="h-5 w-5 animate-spin" />
          </div>
          <p className="mt-4 text-base font-medium text-[color:var(--foreground)]">
            Getting last night&apos;s sleep log ready
          </p>
          <p className="mt-2 text-sm leading-6">
            We are pulling in your planned bedtime, planned wake time, and any previous
            notes so you can answer fast.
          </p>
        </div>
      </section>
    );
  }

  if (requestState === "saved") {
    return (
      <section className="glass-panel mx-auto w-full max-w-3xl rounded-[36px] border border-white/70 p-6 sm:p-8">
        <div className="rounded-[30px] bg-[linear-gradient(145deg,rgba(45,141,143,.12),rgba(246,198,103,.20))] p-6 sm:p-8">
          <div className="inline-flex rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
            Sleep log saved
          </div>
          <h1 className="display mt-4 text-4xl leading-tight text-[color:var(--foreground)]">
            {draftDefaults.nightLabel} logged.
          </h1>
          <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
            We kept the planned history intact and updated the sleep event for that night so
            your calendar now reflects what actually happened.
          </p>
          <div className="mt-5 rounded-[24px] border border-white/80 bg-white/85 p-5">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Updated sleep event
            </p>
            <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">
              {savedSleepTitle ?? "Sleep"}
            </p>
          </div>
          {adaptiveSummary.length ? (
            <div className="mt-5 rounded-[24px] border border-white/80 bg-white/85 p-5">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--teal)]">
                What changed next
              </p>
              <div className="mt-3 grid gap-3">
                {adaptiveSummary.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[18px] border border-[color:var(--line)] bg-[rgba(45,141,143,.06)] px-4 py-3"
                  >
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/report/${sessionId}`}
              className="inline-flex items-center gap-2 rounded-full bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] px-5 py-3 font-medium text-white shadow-[0_18px_32px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5"
            >
              Back to report
            </Link>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)] transition hover:-translate-y-0.5"
              onClick={() => {
                setRequestState("idle");
                setCurrentStepId(steps[0]?.id ?? "closenessToPlan");
              }}
            >
              Edit this log
            </button>
          </div>
          <BetaFeedbackCard
            source="checkin"
            sessionId={sessionId}
            className="mt-6 border-white/80 bg-white/65"
            title="Was this morning log helpful?"
            description="If this check-in felt calming, confusing, or missing something, tell us now while the night is still fresh."
          />
        </div>
      </section>
    );
  }

  return (
    <section className="glass-panel mx-auto w-full max-w-3xl rounded-[36px] border border-white/70 p-3 sm:p-4">
      <div className="sticky top-0 z-10 -mx-3 -mt-3 mb-2 border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,250,244,.97),rgba(255,250,244,.9))] px-3 pt-3 pb-2 backdrop-blur sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-4">
        <div className="flex items-center justify-between gap-4">
          <button
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)] transition hover:-translate-y-0.5",
              currentIndex === 0 && "pointer-events-none opacity-35",
            )}
            type="button"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">
              <span>
                Step {currentIndex + 1} of {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/70">
              <div
                className="h-2.5 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--yellow))] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="editorial-card rounded-[28px] border border-white/75 p-3.5 sm:p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
            Planned window {draftDefaults.plannedBedtimeLabel} to {draftDefaults.plannedWakeTimeLabel}
          </p>
          <div className="hidden h-9 w-9 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)] sm:flex">
            <MoonStar className="h-5 w-5 text-[color:var(--teal)]" />
          </div>
        </div>

        <div>
          <h1 className="display ink-divider text-[1.22rem] leading-tight text-[color:var(--foreground)] sm:text-[1.55rem]">
            {currentStep.title}
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            {currentStep.helper}
          </p>
        </div>

        {currentStep.type === "time" ? (
          <>
            <label className="panel-lift mt-3 block rounded-[22px] border border-[color:var(--line)] bg-white p-4">
              <span className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
                <Clock3 className="h-4 w-4" />
                Pick a time
              </span>
              <input
                className="w-full bg-transparent text-3xl font-medium text-[color:var(--foreground)] outline-none"
                type="time"
                value={draft[currentStep.id as keyof DailyCheckInDraft] as string}
                onChange={(event) =>
                  updateDraft(
                    currentStep.id as keyof DailyCheckInDraft,
                    event.target.value as never,
                  )
                }
              />
            </label>
            <ActionRow
              disabled={!draft[currentStep.id as keyof DailyCheckInDraft] || requestState === "saving"}
              label="Continue"
              loading={requestState === "saving"}
              onClick={goForward}
            />
          </>
        ) : (
          <div className="mt-3 grid gap-2">
            {currentStep.options.map((option) => {
              const selected =
                draft[currentStep.id as keyof DailyCheckInDraft] === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    "panel-lift group flex items-center justify-between gap-4 rounded-[18px] border px-3.5 py-2.5 text-left transition",
                    selected
                      ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(245,127,91,.14),rgba(246,198,103,.16))]"
                      : "border-[color:var(--line)] bg-white hover:border-[rgba(45,141,143,.36)] hover:bg-[rgba(45,141,143,.04)]",
                  )}
                  onClick={() =>
                    handleSingleSelect(
                      currentStep.id as keyof DailyCheckInDraft,
                      option.value,
                    )
                  }
                >
                  <span className="text-[15px] font-medium leading-6 text-[color:var(--foreground)] sm:text-base">
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                        : "border-[color:var(--line)] bg-white text-transparent",
                    )}
                  >
                    <Check className="h-4 w-4" />
                  </span>
                </button>
              );
            })}
          </div>
        )}

      </div>

      {error ? (
        <p className="mt-3 rounded-2xl border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {error}
        </p>
      ) : null}

      <div className="mt-3 hidden items-center justify-between gap-3 text-sm text-[color:var(--muted)] sm:flex">
        <Link href={`/report/${sessionId}`} className="underline-offset-4 hover:underline">
          Back to report
        </Link>
        <span>{draftDefaults.existingEntry ? "Editing this sleep log" : "New sleep log"}</span>
      </div>
    </section>
  );
}

function ActionRow({
  disabled,
  label,
  loading,
  onClick,
}: {
  disabled: boolean;
  label: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="mt-5 flex justify-end">
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white transition",
          disabled
            ? "cursor-not-allowed bg-[rgba(31,35,64,.28)]"
            : "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] shadow-[0_18px_32px_rgba(235,93,52,.24)] hover:-translate-y-0.5",
        )}
        disabled={disabled}
        onClick={onClick}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
