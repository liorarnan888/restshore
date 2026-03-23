"use client";

import { type RefObject, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  LoaderCircle,
  Sparkles,
} from "lucide-react";

import { betaLabel } from "@/lib/brand";
import {
  getOrCreateLaunchVisitorId,
  readStoredResumeToken,
  writeStoredResumeToken,
} from "@/lib/launch-client";
import { getVisibleFlowSteps } from "@/lib/questionnaire";
import type {
  AnswerValue,
  IntakeSession,
  MicroLessonCard,
  QuestionDefinition,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type RequestState = "idle" | "loading" | "error";

async function postJson<T>(url: string, body?: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error("Request failed");
  }

  return (await response.json()) as T;
}

function resolveCurrentStepId(session: IntakeSession) {
  const visibleSteps = getVisibleFlowSteps(session.answers);

  if (visibleSteps.some((step) => step.id === session.currentStepId)) {
    return session.currentStepId;
  }

  for (let index = 0; index < visibleSteps.length; index += 1) {
    const step = visibleSteps[index];

    if (step.type === "question") {
      if (session.answers[step.id] === undefined) {
        return step.id;
      }

      continue;
    }

    const previousQuestionsAnswered = visibleSteps
      .slice(0, index)
      .filter((candidate) => candidate.type === "question")
      .every((candidate) => session.answers[candidate.id] !== undefined);
    const nextQuestion = visibleSteps
      .slice(index + 1)
      .find((candidate) => candidate.type === "question");
    const nextQuestionIsOpen = nextQuestion
      ? session.answers[nextQuestion.id] === undefined
      : false;

    if (previousQuestionsAnswered && (nextQuestionIsOpen || !nextQuestion)) {
      return step.id;
    }
  }

  return visibleSteps[visibleSteps.length - 1]?.id ?? session.currentStepId;
}

const TIME_DEFAULTS: Record<string, string> = {
  desired_wake_time: "07:00",
  usual_bedtime: "23:00",
};

const TIME_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

type TimeParts = {
  hour: string;
  minute: string;
  meridiem: "AM" | "PM";
};

function getDefaultTimeValue(questionId: string) {
  return TIME_DEFAULTS[questionId] ?? "08:00";
}

function toTimeParts(value: string): TimeParts | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    return null;
  }

  const hours24 = Number(match[1]);
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hour12 = hours24 % 12 || 12;

  return {
    hour: String(hour12),
    minute: match[2],
    meridiem,
  };
}

function toTimeValue(parts: TimeParts) {
  const hour12 = Number(parts.hour);

  if (!Number.isInteger(hour12) || hour12 < 1 || hour12 > 12) {
    return null;
  }

  if (!/^[0-5]\d$/.test(parts.minute)) {
    return null;
  }

  const normalizedHours =
    parts.meridiem === "PM"
      ? hour12 === 12
        ? 12
        : hour12 + 12
      : hour12 === 12
        ? 0
        : hour12;

  return `${String(normalizedHours).padStart(2, "0")}:${parts.minute}`;
}

function formatAmericanTime(value: string) {
  const parts = toTimeParts(value);

  if (!parts) {
    return value;
  }

  return `${parts.hour}:${parts.minute} ${parts.meridiem}`;
}

function buildMinuteOptions(selectedMinute: string) {
  if (!TIME_MINUTE_OPTIONS.includes(selectedMinute)) {
    return [...TIME_MINUTE_OPTIONS, selectedMinute].sort(
      (left, right) => Number(left) - Number(right),
    );
  }

  return TIME_MINUTE_OPTIONS;
}

export function IntakeExperience({ route = "/" }: { route?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [session, setSession] = useState<IntakeSession | null>(null);
  const [requestState, setRequestState] = useState<RequestState>("loading");
  const [error, setError] = useState<string | null>(null);
  const [currentStepId, setCurrentStepId] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [pendingQuestionId, setPendingQuestionId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, AnswerValue>>({});
  const [isFinalizing, setIsFinalizing] = useState(false);
  const saveQueueRef = useRef(Promise.resolve());

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      setRequestState("loading");
      setError(null);

      try {
        const queryToken = searchParams.get("resume");
        const storedToken = readStoredResumeToken();
        const resumeToken = queryToken ?? storedToken;
        const requestContext = {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          visitorId: getOrCreateLaunchVisitorId(),
          route,
          referrer: document.referrer || undefined,
        };

        let loadedSession: IntakeSession;

        if (resumeToken) {
          const response = await fetch(`/api/intake/resume/${resumeToken}`);

          if (response.ok) {
            const payload = (await response.json()) as { session: IntakeSession };
            loadedSession = payload.session;
          } else {
            const started = await postJson<{ session: IntakeSession }>(
              "/api/intake/start",
              requestContext,
            );
            loadedSession = started.session;
          }
        } else {
          const started = await postJson<{ session: IntakeSession }>(
            "/api/intake/start",
            requestContext,
          );
          loadedSession = started.session;
        }

        if (!active) {
          return;
        }

        if (
          loadedSession.status === "ready_for_google" ||
          loadedSession.status === "completed"
        ) {
          router.push(`/report/${loadedSession.id}`);
          return;
        }

        writeStoredResumeToken(loadedSession.resumeToken);
        setSession(loadedSession);
        setAnswers(loadedSession.answers);
        setDrafts({});
        setIsFinalizing(false);
        setCurrentStepId(resolveCurrentStepId(loadedSession));
        setRequestState("idle");
      } catch {
        if (!active) {
          return;
        }

        setRequestState("error");
        setError("We couldn’t load the interview. Please refresh and try again.");
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [route, router, searchParams]);

  const visibleSteps = getVisibleFlowSteps(answers);
  const currentIndex = Math.max(
    visibleSteps.findIndex((step) => step.id === currentStepId),
    0,
  );
  const currentStep = visibleSteps[currentIndex];
  const progress = visibleSteps.length
    ? ((currentIndex + 1) / visibleSteps.length) * 100
    : 0;
  const sections = [...new Set(visibleSteps.map((step) => step.section).filter(Boolean))];
  const currentSection = currentStep?.section;
  const currentSectionIndex = sections.findIndex((section) => section === currentSection);
  const answeredCount = Object.keys(answers).length;
  const compactEntry = route === "/start";
  const isFinalStep = currentIndex === visibleSteps.length - 1;
  const questionDraft =
    currentStep?.type === "question"
      ? drafts[currentStep.id] ??
        answers[currentStep.id] ??
        (currentStep.inputType === "multi-select" ? [] : "")
      : "";

  const goBack = () => {
    if (!currentIndex) {
      return;
    }

    setCurrentStepId(visibleSteps[currentIndex - 1].id);
  };

  const continueFromPassiveStep = async () => {
    const nextStep = visibleSteps[currentIndex + 1];

    if (nextStep) {
      setCurrentStepId(nextStep.id);
      return;
    }

    if (!session) {
      return;
    }

    setIsFinalizing(true);
    setError(null);

    try {
      const finalized = await postJson<{ session: IntakeSession }>(
        "/api/intake/finalize",
        {
          sessionId: session.id,
        },
      );
      router.push(`/report/${finalized.session.id}`);
    } catch {
      setIsFinalizing(false);
      setError("We couldn't finish the interview yet. Please try once more.");
    }
  };

  const saveQuestion = async (question: QuestionDefinition, value: AnswerValue) => {
    if (!session) {
      return;
    }

    const previousStepId = currentStep.id;
    const optimisticAnswers = {
      ...answers,
      [question.id]: value,
    };
    const nextSteps = getVisibleFlowSteps(optimisticAnswers);
    const currentInNext = Math.max(
      nextSteps.findIndex((step) => step.id === question.id),
      0,
    );
    const nextStepId = nextSteps[currentInNext + 1]?.id;

    setAnswers(optimisticAnswers);
    setError(null);
    setPendingQuestionId(question.id);
    if (nextStepId) {
      setCurrentStepId(nextStepId);
    } else {
      setIsFinalizing(true);
    }

    const saveTask = async () => {
      try {
        const payload = await postJson<{ session: IntakeSession }>("/api/intake/save", {
          sessionId: session.id,
          questionId: question.id,
          value,
          nextStepId,
        });

        setSession(payload.session);
        setAnswers(payload.session.answers);
        setDrafts((currentDrafts) => {
          const nextDrafts = { ...currentDrafts };
          delete nextDrafts[question.id];
          return nextDrafts;
        });

        if (!nextStepId) {
          try {
            const finalized = await postJson<{ session: IntakeSession }>(
              "/api/intake/finalize",
              {
                sessionId: payload.session.id,
              },
            );
            router.push(`/report/${finalized.session.id}`);
            return;
          } catch {
            setIsFinalizing(false);
            throw new Error("Unable to finalize interview");
          }
        }
      } catch {
        setIsFinalizing(false);
        if (nextStepId) {
          setCurrentStepId(previousStepId);
        }

        setError("We couldn’t save that answer. Please try once more.");
        throw new Error("Unable to save answer");
      } finally {
        setPendingQuestionId((current) => (current === question.id ? null : current));
      }
    };

    const nextSave = saveQueueRef.current.then(saveTask);
    saveQueueRef.current = nextSave;

    try {
      await nextSave;
    } catch {
      saveQueueRef.current = Promise.resolve();
    }
  };


  if (requestState === "loading" && !session) {
    return (
      <section className="glass-panel flex min-h-[720px] items-center justify-center rounded-[36px] border border-white/70 p-8">
        <div className="flex items-center gap-3 text-[color:var(--muted)]">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          <span>Preparing your interview…</span>
        </div>
      </section>
    );
  }

  if (isFinalizing) {
    return (
      <section className="glass-panel soft-ring relative mx-auto flex min-h-[560px] w-full max-w-5xl items-center justify-center overflow-hidden rounded-[36px] border border-white/70 p-4 sm:p-5">
        <div className="pointer-events-none absolute -right-20 top-20 h-48 w-48 rounded-full bg-[rgba(45,141,143,.12)] blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-20 h-40 w-40 rounded-full bg-[rgba(245,127,91,.14)] blur-3xl" />

        <div className="editorial-card relative max-w-2xl rounded-[32px] border border-white/80 px-6 py-8 text-center shadow-[0_24px_60px_rgba(31,35,64,0.10)] sm:px-8 sm:py-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[linear-gradient(135deg,rgba(245,127,91,.18),rgba(246,198,103,.22))]">
            <Sparkles className="h-7 w-7 text-[color:var(--accent-strong)]" />
          </div>
          <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-[color:var(--teal)]">
            Building your plan
          </p>
          <h2 className="display mt-3 text-[2rem] leading-[1.02] text-[color:var(--foreground)] sm:text-[2.5rem]">
            Building your report and starting plan
          </h2>
          <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
            Next you&apos;ll see what seems to be shaping your sleep and the starting structure built from your answers.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-[rgba(45,141,143,.14)] bg-white/85 px-5 py-3 text-sm font-medium text-[color:var(--foreground)]">
            <LoaderCircle className="h-4 w-4 animate-spin text-[color:var(--accent-strong)]" />
            Building your plan now
          </div>
        </div>
      </section>
    );
  }

  if (!session || !currentStep) {
    return (
      <section className="glass-panel min-h-[720px] rounded-[36px] border border-white/70 p-8">
        <p className="text-sm text-[color:var(--muted)]">
          {error ?? "Something went wrong while starting the intake."}
        </p>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "glass-panel soft-ring relative mx-auto flex w-full max-w-5xl flex-col overflow-hidden rounded-[36px] border border-white/70",
        compactEntry ? "p-3 sm:p-4" : "p-4 sm:p-5",
      )}
    >
      <div className="pointer-events-none absolute -right-20 top-20 h-48 w-48 rounded-full bg-[rgba(45,141,143,.12)] blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-20 h-40 w-40 rounded-full bg-[rgba(245,127,91,.14)] blur-3xl" />
      <div
        className={cn(
          "sticky top-0 z-10 mb-3 border-b border-white/70 bg-[linear-gradient(180deg,rgba(255,250,244,.96),rgba(255,250,244,.88))] backdrop-blur",
          compactEntry
            ? "-mx-3 -mt-3 px-3 pt-2.5 pb-2 sm:-mx-4 sm:-mt-4 sm:px-4 sm:pt-3"
            : "-mx-4 -mt-4 px-4 pt-4 pb-3 sm:-mx-5 sm:-mt-5 sm:px-5 sm:pt-5",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <button
            className={cn(
              compactEntry
                ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)] transition hover:-translate-y-0.5"
                : "inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--line)] bg-white/80 text-[color:var(--foreground)] transition hover:-translate-y-0.5",
              currentIndex === 0 && "pointer-events-none opacity-35",
            )}
            type="button"
            onClick={goBack}
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex-1">
            <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[color:var(--muted)]">
              <span>
                {compactEntry
                  ? `${currentIndex + 1} / ${visibleSteps.length}`
                  : `Step ${currentIndex + 1} of ${visibleSteps.length}`}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-3 rounded-full bg-white/70">
              <div
                className="h-3 rounded-full bg-[linear-gradient(90deg,var(--accent),var(--yellow))] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
        {!compactEntry ? (
          <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5">
              About 8 to 10 minutes
            </span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5">
              {answeredCount} answers saved
            </span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5">
              {betaLabel}
            </span>
            <span className="rounded-full border border-white/80 bg-white/75 px-3 py-1.5">
              6-week plan ahead
            </span>
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "editorial-card flex flex-col gap-3 rounded-[30px] border border-white/75",
          compactEntry ? "p-3 sm:p-4" : "p-4 sm:p-5",
        )}
      >
        <div
          className={cn(
            "pb-1",
              compactEntry
                ? "flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]"
                : "flex flex-wrap items-center gap-2",
          )}
        >
          {currentSection ? (
            compactEntry ? (
              <span className="text-[color:var(--teal)]">{currentSection}</span>
            ) : (
              <div className="rounded-full border border-[rgba(45,141,143,.28)] bg-[rgba(45,141,143,.12)] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--teal)]">
                {currentSection}
              </div>
            )
          ) : null}
            {currentSectionIndex >= 0 ? (
              compactEntry ? (
                <span className="text-[color:var(--muted)]">
                  / Part {currentSectionIndex + 1} of {sections.length}
                </span>
              ) : (
              <div className="rounded-full border border-[color:var(--line)] bg-white/75 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-[color:var(--muted)]">
                Part {currentSectionIndex + 1} of {sections.length}
              </div>
            )
          ) : null}
        </div>

        {currentStep.type === "question" ? (
          <QuestionStep
            key={currentStep.id}
            question={currentStep}
            draft={questionDraft}
            isSubmitting={pendingQuestionId === currentStep.id}
            isFinalStep={isFinalStep}
            compact={compactEntry}
            onDraftChange={(value) =>
              setDrafts((currentDrafts) => ({
                ...currentDrafts,
                [currentStep.id]: value,
              }))
            }
            onSubmit={saveQuestion}
          />
        ) : null}

        {currentStep.type === "lesson" ? (
          <LessonStep
            key={currentStep.id}
            lesson={currentStep}
            isFinalStep={isFinalStep}
            onContinue={() => void continueFromPassiveStep()}
          />
        ) : null}


      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}

function StepHeader({
  section,
  eyebrow,
  title,
  helper,
  compact = false,
}: {
  section?: string;
  eyebrow?: string;
  title: string;
  helper?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", compact && "space-y-1")}>
      {section && !compact ? (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--accent-strong)]">
          {section}
        </p>
      ) : null}
      {eyebrow && !compact ? (
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "display ink-divider leading-tight text-[color:var(--foreground)]",
          compact ? "text-[1.34rem] sm:text-[1.7rem]" : "text-[1.65rem] sm:text-[2.1rem]",
        )}
      >
        {title}
      </h2>
      {helper ? (
        <p
          className={cn(
            "max-w-3xl text-[color:var(--muted)]",
            compact ? "mt-2 text-[0.92rem] leading-6" : "mt-3 text-[0.95rem] leading-6",
          )}
        >
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function QuestionStep({
  question,
  draft,
  isSubmitting,
  isFinalStep,
  onDraftChange,
  onSubmit,
  compact = false,
}: {
  question: QuestionDefinition;
  draft: AnswerValue;
  isSubmitting: boolean;
  isFinalStep: boolean;
  onDraftChange: (value: AnswerValue) => void;
  onSubmit: (question: QuestionDefinition, value: AnswerValue) => Promise<void>;
  compact?: boolean;
}) {
  const multiDraft = Array.isArray(draft) ? draft : [];
  const textDraft = typeof draft === "string" ? draft : "";
  const twoColumnOptions = (question.options?.length ?? 0) >= 5;
  const continueButtonRef = useRef<HTMLButtonElement | null>(null);
  const resolvedTimeValue = textDraft || getDefaultTimeValue(question.id);
  const timeParts =
    toTimeParts(resolvedTimeValue) ?? toTimeParts(getDefaultTimeValue(question.id));

  const submitCurrentDraft = () => {
    if (question.inputType === "multi-select") {
      if (!multiDraft.length || isSubmitting) {
        return;
      }

      void onSubmit(question, multiDraft);
      return;
    }

    if (question.inputType === "time") {
      if (!resolvedTimeValue || isSubmitting) {
        return;
      }

      void onSubmit(question, resolvedTimeValue);
    }
  };

  const updateTimeDraft = (nextParts: Partial<TimeParts>) => {
    if (!timeParts) {
      return;
    }

    const nextValue = toTimeValue({
      ...timeParts,
      ...nextParts,
    });

    if (!nextValue) {
      return;
    }

    onDraftChange(nextValue);
  };

  return (
    <div className="flex flex-col">
      <StepHeader
        section={question.section}
        eyebrow={question.eyebrow}
        title={question.title}
        helper={question.helper}
        compact={compact}
      />

      {question.inputType === "single-select" ? (
        <div
          className={cn(
            "mt-3 grid gap-2.5",
            twoColumnOptions && "lg:grid-cols-2",
          )}
        >
          {question.options?.map((option) => {
            const selected = textDraft === option.value;
            return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  compact
                    ? "panel-lift group flex items-start justify-between gap-3 rounded-[20px] border px-3.5 py-2.5 text-left transition"
                    : "panel-lift group flex items-start justify-between gap-4 rounded-[22px] border px-4 py-3 text-left transition",
                  selected
                    ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(245,127,91,.14),rgba(246,198,103,.16))]"
                    : "border-[color:var(--line)] bg-white hover:-translate-y-0.5 hover:border-[rgba(45,141,143,.36)] hover:bg-[rgba(45,141,143,.04)]",
                )}
                onClick={() => void onSubmit(question, option.value)}
              >
                <div>
                  <p
                    className={cn(
                      "font-medium text-[color:var(--foreground)]",
                      compact ? "text-[0.95rem] leading-6" : "text-[0.98rem] sm:text-[1.02rem]",
                    )}
                  >
                    {option.label}
                  </p>
                  {option.description ? (
                    <p
                      className={cn(
                        "mt-1 text-[color:var(--muted)]",
                        compact ? "text-[0.88rem] leading-5" : "text-sm leading-5",
                      )}
                    >
                      {option.description}
                    </p>
                  ) : null}
                </div>
                <span
                  className={cn(
                    compact
                      ? "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                      : "mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                    selected
                      ? "border-[color:var(--accent)] bg-[color:var(--accent)] text-white"
                      : "border-[color:var(--line)] bg-white text-transparent group-hover:text-[color:var(--muted)]",
                  )}
                >
                  <Check className="h-4 w-4" />
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {question.inputType === "multi-select" ? (
        <form
          className="contents"
          onSubmit={(event) => {
            event.preventDefault();
            submitCurrentDraft();
          }}
        >
          <div
            className={cn(
              "mt-3 grid gap-2.5",
              twoColumnOptions && "lg:grid-cols-2",
            )}
          >
            {question.options?.map((option) => {
              const selected = multiDraft.includes(option.value);
              return (
              <button
                key={option.value}
                type="button"
                className={cn(
                  compact
                    ? "panel-lift group flex items-center justify-between gap-3 rounded-[20px] border px-3.5 py-2.5 text-left transition"
                    : "panel-lift group flex items-center justify-between gap-4 rounded-[22px] border px-4 py-3 text-left transition",
                  selected
                    ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(245,127,91,.14),rgba(246,198,103,.16))]"
                    : "border-[color:var(--line)] bg-white hover:border-[rgba(45,141,143,.36)] hover:bg-[rgba(45,141,143,.04)]",
                )}
                  onClick={() => {
                    const nextSelection = selected
                      ? multiDraft.filter((item) => item !== option.value)
                      : [...multiDraft.filter((item) => item !== "none"), option.value];
                    onDraftChange(
                      option.value === "none" && !selected ? ["none"] : nextSelection,
                    );
                    continueButtonRef.current?.focus();
                  }}
                >
                  <span
                    className={cn(
                      "font-medium text-[color:var(--foreground)]",
                      compact ? "text-[0.95rem] leading-6" : "text-sm sm:text-base",
                    )}
                  >
                    {option.label}
                  </span>
                  <span
                    className={cn(
                      compact
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border"
                        : "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
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
          <ActionRow
            disabled={!multiDraft.length || isSubmitting}
            label={isFinalStep ? "Build my plan" : "Continue"}
            loading={isSubmitting}
            buttonRef={continueButtonRef}
            type="submit"
            onClick={submitCurrentDraft}
          />
        </form>
      ) : null}

      {question.inputType === "time" ? (
        <form
          className="mt-4 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            submitCurrentDraft();
          }}
          onKeyDownCapture={(event) => {
            if (event.key === "Enter" && event.target instanceof HTMLSelectElement) {
              event.preventDefault();
              submitCurrentDraft();
            }
          }}
        >
          <div className="panel-lift rounded-[30px] border border-[color:var(--line)] bg-[linear-gradient(145deg,rgba(255,250,244,.96),rgba(255,255,255,.9))] p-5 sm:p-6">
            <div className="rounded-[24px] bg-[rgba(45,141,143,.08)] p-4">
              <span className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-[color:var(--teal)]">
                <Clock3 className="h-4 w-4" />
                Pick a time
              </span>
              <p className="mt-3 display text-3xl text-[color:var(--foreground)] sm:text-4xl">
                {formatAmericanTime(resolvedTimeValue)}
              </p>
            </div>

            {timeParts ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <TimeSelect
                  label="Hour"
                  value={timeParts.hour}
                  onChange={(value) => updateTimeDraft({ hour: value })}
                  options={Array.from({ length: 12 }, (_, index) => {
                    const value = String(index + 1);

                    return {
                      value,
                      label: value,
                    };
                  })}
                />
                <TimeSelect
                  label="Minutes"
                  value={timeParts.minute}
                  onChange={(value) => updateTimeDraft({ minute: value })}
                  options={buildMinuteOptions(timeParts.minute).map((value) => ({
                    value,
                    label: value,
                  }))}
                />
                <div className="rounded-[24px] border border-[color:var(--line)] bg-white/90 p-3">
                  <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
                    AM / PM
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {(["AM", "PM"] as const).map((meridiem) => {
                      const selected = timeParts.meridiem === meridiem;

                      return (
                        <button
                          key={meridiem}
                          type="button"
                          className={cn(
                            "rounded-[18px] px-4 py-3 text-sm font-semibold transition",
                            selected
                              ? "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] text-white shadow-[0_12px_24px_rgba(235,93,52,.2)]"
                              : "border border-[color:var(--line)] bg-white text-[color:var(--foreground)] hover:border-[rgba(45,141,143,.36)]",
                          )}
                          onClick={() => {
                            updateTimeDraft({ meridiem });
                            continueButtonRef.current?.focus();
                          }}
                        >
                          {meridiem}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          <ActionRow
            disabled={!resolvedTimeValue || isSubmitting}
            label={isFinalStep ? "Build my plan" : "Continue"}
            loading={isSubmitting}
            buttonRef={continueButtonRef}
            type="submit"
            onClick={submitCurrentDraft}
          />
        </form>
      ) : null}
    </div>
  );
}

function LessonStep({
  lesson,
  isFinalStep,
  onContinue,
}: {
  lesson: MicroLessonCard;
  isFinalStep: boolean;
  onContinue: () => void;
}) {
  return (
    <>
      <div className="rounded-[32px] bg-[linear-gradient(140deg,rgba(45,141,143,.16),rgba(246,198,103,.28))] p-6 sm:p-7">
        <div className="mb-5 inline-flex rounded-full border border-white/80 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
          {lesson.accent}
        </div>
        <StepHeader
          section={lesson.section}
          eyebrow={lesson.eyebrow}
          title={lesson.title}
          helper={lesson.body}
        />
        <div className="mt-6 rounded-[24px] border border-white/80 bg-white/80 p-5">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 text-[color:var(--accent-strong)]" />
            <p className="text-base leading-7 text-[color:var(--foreground)]">
              {lesson.insight}
            </p>
          </div>
        </div>
      </div>
      <ActionRow
        disabled={false}
        label={isFinalStep ? "Build my plan" : "Keep going"}
        onClick={onContinue}
      />
    </>
  );
}

function TimeSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="rounded-[24px] border border-[color:var(--line)] bg-white/90 p-3">
      <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
        {label}
      </span>
      <select
        className="mt-3 w-full rounded-[18px] border border-[color:var(--line)] bg-[rgba(255,250,244,.95)] px-4 py-3 text-2xl font-semibold text-[color:var(--foreground)] outline-none transition focus:border-[rgba(45,141,143,.36)]"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ActionRow({
  disabled,
  label,
  loading,
  type = "button",
  buttonRef,
  onClick,
}: {
  disabled: boolean;
  label: string;
  loading?: boolean;
  type?: "button" | "submit";
  buttonRef?: RefObject<HTMLButtonElement | null>;
  onClick: () => void;
}) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        ref={buttonRef}
        type={type}
        className={cn(
          "inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white transition",
          disabled
            ? "cursor-not-allowed bg-[rgba(31,35,64,.28)]"
            : "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] shadow-[0_18px_32px_rgba(235,93,52,.24)] hover:-translate-y-0.5",
        )}
        disabled={disabled}
        onClick={() => {
          if (type === "button") {
            onClick();
          }
        }}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        {label}
        <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}






