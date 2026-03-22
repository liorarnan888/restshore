"use client";

import { useState } from "react";

type ScenarioId =
  | "stable_expand"
  | "mixed_hold"
  | "low_efficiency_shrink"
  | "insufficient_logs"
  | "contradictory_data"
  | "red_flags"
  | "context_shift"
  | "severe_impairment";

type PreviewResponse = {
  scenario: ScenarioId;
  scenarioLabel: string;
  reviewWindow: Array<{
    nightDate: string;
    nightLabel: string;
    status: "logged" | "missing";
    note: string;
  }>;
  simulatedLogs: Array<{
    nightDate: string;
    nightLabel: string;
    summary: string;
    responses: Array<{
      label: string;
      value: string;
    }>;
  }>;
  decision: {
    bucket: "expand" | "hold" | "shrink";
    reasonCode: string;
    reason: string;
    explanatorySummary: string;
    effectiveDate: string;
  };
  policyTrace: Array<{
    label: string;
    value: string;
  }>;
  planBeforeAfter: Array<{
    label: string;
    before: string;
    after: string;
    note: string;
    changed: boolean;
  }>;
  nextSchedulePreview: Array<{
    label: string;
    before: string;
    after: string;
    note: string;
    changed: boolean;
  }>;
};

const scenarios: Array<{
  id: ScenarioId;
  label: string;
  expectation: string;
}> = [
  {
    id: "stable_expand",
    label: "Stable week -> expand",
    expectation: "Should widen the sleep window by 15 minutes and move bedtime earlier.",
  },
  {
    id: "mixed_hold",
    label: "Mixed week -> hold",
    expectation: "Should keep the structure steady and change nothing automatically.",
  },
  {
    id: "low_efficiency_shrink",
    label: "Repeated low efficiency -> shrink",
    expectation: "Should narrow the sleep window by 15 minutes and move bedtime later.",
  },
  {
    id: "insufficient_logs",
    label: "Only 4 logs -> hold steady",
    expectation: "Should keep the plan steady because the data window is too sparse.",
  },
  {
    id: "contradictory_data",
    label: "Contradictory diary -> hold steady",
    expectation: "Should keep the plan steady because the diary data is internally inconsistent.",
  },
  {
    id: "red_flags",
    label: "Red flag present -> hold steady",
    expectation: "Should keep the plan steady and avoid a structural change this week.",
  },
  {
    id: "context_shift",
    label: "Travel / schedule shift -> hold steady",
    expectation: "Should keep the plan steady because the week is not comparable.",
  },
  {
    id: "severe_impairment",
    label: "Severe impairment -> hold steady",
    expectation: "Should avoid structural change and keep the plan steady for now.",
  },
];

function bucketLabel(value: PreviewResponse["decision"]["bucket"]) {
  switch (value) {
    case "expand":
      return "Expand";
    case "hold":
      return "Hold";
    case "shrink":
      return "Shrink";
  }
}

export function StructuralReviewPreviewCard({ sessionId }: { sessionId: string }) {
  const [loading, setLoading] = useState<ScenarioId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);

  async function runScenario(scenario: ScenarioId) {
    setLoading(scenario);
    setError(null);

    try {
      const response = await fetch("/api/debug/structural-review-preview", {
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
          : "Could not run weekly structural preview",
      );
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="glass-panel editorial-card rounded-[32px] border border-white/75 p-6">
      <h2 className="display text-3xl text-[color:var(--foreground)]">
        Weekly structural review lab
      </h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        Preview the once-per-week decision engine before it ever touches a real
        plan. Each scenario shows the whole 7-night review window, what got logged,
        and the exact structural result that should follow.
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
              <span className="rounded-full bg-[rgba(245,127,91,.14)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--accent-strong)]">
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
            Weekly review result
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="font-semibold text-[color:var(--foreground)]">
              {preview.scenarioLabel}
            </p>
            <span className="rounded-full border border-[color:var(--line)] bg-[rgba(246,198,103,.12)] px-3 py-1 text-xs font-medium uppercase tracking-[0.12em] text-[color:var(--foreground)]">
              {bucketLabel(preview.decision.bucket)}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
            {preview.decision.explanatorySummary}
          </p>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
              7-night review window
            </p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {preview.reviewWindow.map((night) => (
                <div
                  key={night.nightDate}
                  className={`rounded-[18px] border px-4 py-4 ${
                    night.status === "logged"
                      ? "border-[rgba(45,141,143,.16)] bg-[rgba(45,141,143,.06)]"
                      : "border-[rgba(31,35,64,.08)] bg-[rgba(31,35,64,.04)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {night.nightLabel}
                    </p>
                    <span className="rounded-full border border-[color:var(--line)] bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[color:var(--foreground)]">
                      {night.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                    {night.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Logged nights in detail
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

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[20px] border border-[color:var(--line)] bg-[rgba(246,198,103,.12)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                Policy trace
              </p>
              <div className="mt-3 grid gap-3">
                {preview.policyTrace.map((item) => (
                  <div key={item.label} className="rounded-[16px] bg-white/85 p-3">
                    <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--foreground)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[20px] border border-[color:var(--line)] bg-[rgba(245,127,91,.08)] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
                Before / after on the plan
              </p>
              <div className="mt-3 grid gap-3">
                {preview.planBeforeAfter.map((item) => (
                  <div key={item.label} className="rounded-[16px] bg-white/85 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-[color:var(--foreground)]">
                        {item.label}
                      </p>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                          item.changed
                            ? "bg-[rgba(235,93,52,.12)] text-[color:var(--accent-strong)]"
                            : "bg-[rgba(31,35,64,.06)] text-[color:var(--muted)]"
                        }`}
                      >
                        {item.changed ? "Changes" : "Stays the same"}
                      </span>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                          Before
                        </p>
                        <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                          {item.before}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                          After
                        </p>
                        <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                          {item.after}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                      {item.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--teal)]">
              Next-night schedule preview
            </p>
            <div className="mt-3 grid gap-3">
              {preview.nextSchedulePreview.map((item) => (
                <div
                  key={item.label}
                  className="rounded-[18px] border border-[color:var(--line)] bg-white/85 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[color:var(--foreground)]">
                      {item.label}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.12em] ${
                        item.changed
                          ? "bg-[rgba(45,141,143,.12)] text-[color:var(--teal)]"
                          : "bg-[rgba(31,35,64,.06)] text-[color:var(--muted)]"
                      }`}
                    >
                      {item.changed ? "Will move" : "Fixed"}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        Before
                      </p>
                      <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                        {item.before}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
                        After
                      </p>
                      <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                        {item.after}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
