"use client";

import { useState } from "react";

type ScenarioId =
  | "single_bad_night"
  | "double_late_start"
  | "double_sleep_onset"
  | "double_fragmented"
  | "double_early_wake"
  | "double_fatigue"
  | "double_late_start_sleep_onset"
  | "double_fragmented_fatigue"
  | "double_early_wake_fatigue";

type PreviewResponse = {
  scenario: ScenarioId;
  simulatedNightDates: string[];
  simulatedLogs: Array<{
    nightDate: string;
    nightLabel: string;
    summary: string;
    responses: Array<{
      label: string;
      value: string;
    }>;
  }>;
  summary: Array<{
    id: string;
    title: string;
    detail: string;
  }>;
  triggeredRules: Array<{
    id: string;
    title: string;
    detail: string;
    evidence: string;
    affects: string[];
  }>;
  changedEvents: Array<{
    id: string;
    dayLabel: string;
    titleBefore: string;
    titleAfter: string;
    descriptionBefore: string;
    descriptionAfter: string;
  }>;
  shouldAdjustFuturePlan: boolean;
};

const scenarios: Array<{
  id: ScenarioId;
  label: string;
  expectation: string;
}> = [
  {
    id: "single_bad_night",
    label: "1 bad night only",
    expectation: "Should not change the future plan",
  },
  {
    id: "double_late_start",
    label: "2 late starts",
    expectation: "Should tighten the evening runway",
  },
  {
    id: "double_sleep_onset",
    label: "2 slow sleep-onset nights",
    expectation: "Should strengthen in-bed / wind-down guidance",
  },
  {
    id: "double_fragmented",
    label: "2 fragmented nights",
    expectation: "Should strengthen overnight reset guidance",
  },
  {
    id: "double_early_wake",
    label: "2 early wakes",
    expectation: "Should reinforce the morning anchor",
  },
  {
    id: "double_fatigue",
    label: "2 exhausted mornings",
    expectation: "Should add recovery guardrails",
  },
  {
    id: "double_late_start_sleep_onset",
    label: "Late start + slow sleep",
    expectation: "Should show overlapping evening and in-bed changes",
  },
  {
    id: "double_fragmented_fatigue",
    label: "Fragmented + exhausted",
    expectation: "Should show overnight reset plus recovery guardrails",
  },
  {
    id: "double_early_wake_fatigue",
    label: "Early wake + exhausted",
    expectation: "Should reinforce morning anchors and recovery support",
  },
];

export function AdaptationPreviewCard({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState<ScenarioId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  async function runScenario(scenario: ScenarioId) {
    setLoading(scenario);
    setError(null);

    try {
      const response = await fetch("/api/debug/adaptation-preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId,
          scenario,
        }),
      });

      const payload = (await response.json()) as PreviewResponse & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Preview failed");
      }

      setPreview(payload);
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Could not run preview",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
      <h2 className="display text-3xl text-[color:var(--foreground)]">
        Adaptation lab
      </h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        Local testing only. Run exact nightly diary scenarios and see the whole chain:
        what was logged, what the engine concluded, what the update summary would say,
        and exactly how future events would change.
      </p>
      <div className="mt-5 grid gap-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            className="panel-lift rounded-[24px] border border-[color:var(--line)] bg-white/90 px-4 py-4 text-left transition hover:-translate-y-0.5"
            onClick={() => runScenario(scenario.id)}
            disabled={loading !== null}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold text-[color:var(--foreground)]">
                {scenario.label}
              </p>
              <span className="rounded-full bg-[rgba(45,141,143,.12)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--teal)]">
                {loading === scenario.id ? "Running" : "Preview"}
              </span>
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              {scenario.expectation}
            </p>
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-4 rounded-2xl border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {error}
        </p>
      ) : null}

      {preview ? (
        <div className="mt-5 rounded-[24px] border border-[color:var(--line)] bg-white/90 p-5">
          <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
            Preview result
          </p>
          <p className="mt-2 font-semibold text-[color:var(--foreground)]">
            {preview.shouldAdjustFuturePlan
              ? "This pattern should change future guidance"
              : "This pattern should not change future guidance"}
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Simulated nights: {preview.simulatedLogs.map((log) => log.nightLabel).join(" + ")}
          </p>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Simulated check-ins
            </p>
            <div className="mt-3 grid gap-3">
              {preview.simulatedLogs.map((log) => (
                <div
                  key={log.nightDate}
                  className="rounded-[18px] border border-[color:var(--line)] bg-[rgba(45,141,143,.06)] px-4 py-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {log.nightLabel}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                    {log.summary}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {log.responses.map((response) => (
                      <div
                        key={`${log.nightDate}-${response.label}`}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="text-[color:var(--muted)]">{response.label}</span>
                        <span className="max-w-[55%] text-right font-medium text-[color:var(--foreground)]">
                          {response.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {preview.summary.length ? (
            <div className="mt-4 grid gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                What the update summary would say
              </p>
              {preview.summary.map((item) => (
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
          ) : null}

          {preview.triggeredRules.length ? (
            <div className="mt-4 grid gap-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                Rule engine trace
              </p>
              {preview.triggeredRules.map((item) => (
                <div
                  key={item.id}
                  className="rounded-[18px] border border-[color:var(--line)] bg-[rgba(246,198,103,.14)] px-4 py-4"
                >
                  <p className="font-semibold text-[color:var(--foreground)]">
                    {item.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">
                    {item.detail}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--foreground)]">
                    <span className="font-medium">Why it fired:</span> {item.evidence}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {item.affects.map((target) => (
                      <span
                        key={`${item.id}-${target}`}
                        className="rounded-full border border-[color:var(--line)] bg-white/90 px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--foreground)]"
                      >
                        {target}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {preview.changedEvents.length ? (
            <div className="mt-5">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                Before / after for future events
              </p>
              <div className="mt-3 grid gap-3">
              {preview.changedEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-[18px] border border-[color:var(--line)] bg-[rgba(245,127,91,.08)] px-4 py-4"
                >
                  <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                    {event.dayLabel}
                  </p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-[16px] border border-[color:var(--line)] bg-white/85 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        Before
                      </p>
                      <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                        {event.titleBefore}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--muted)]">
                        {event.descriptionBefore}
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[color:var(--line)] bg-white/85 p-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        After
                      </p>
                      <p className="mt-2 font-semibold text-[color:var(--foreground)]">
                        {event.titleAfter}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[color:var(--muted)]">
                        {event.descriptionAfter}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
