"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, TriangleAlert } from "lucide-react";

type ReportResetButtonProps = {
  sessionId: string;
  email: string;
};

export function ReportResetButton({
  sessionId,
  email,
}: ReportResetButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    const confirmed = window.confirm(
      `Delete every RestShore session and saved report tied to ${email}, and start from scratch?`,
    );

    if (!confirmed) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/account/reset", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error("We couldn't fully clear this account yet.");
      }

      const payload = (await response.json()) as {
        calendarDeletionWarnings?: string[];
      };

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("sleep-compass-resume-token");
      }

      if (payload.calendarDeletionWarnings?.length) {
        window.alert(
          "Your saved data was cleared. A few old Google calendars may still need manual removal inside Google Calendar.",
        );
      }

      startTransition(() => {
        router.push("/start?fresh=1");
        router.refresh();
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "We couldn't fully clear this account yet.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-[32px] border border-[rgba(235,93,52,.14)] bg-[rgba(255,248,244,0.9)] px-5 py-6 shadow-[0_18px_44px_rgba(31,35,64,0.08)] sm:px-6">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[rgba(235,93,52,.12)]">
          <TriangleAlert className="h-5 w-5 text-[color:var(--accent-strong)]" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--accent-strong)]">
            Start over
          </p>
          <h2 className="mt-3 text-2xl font-semibold leading-9 text-[color:var(--foreground)]">
            Clear this account and begin again
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[color:var(--muted)]">
            This removes every saved report, questionnaire session, and linked sleep
            log tied to <span className="font-medium text-[color:var(--foreground)]">{email}</span>. We will also try to remove any RestShore calendars connected to those sessions.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            void handleReset();
          }}
          disabled={busy}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(235,93,52,.18)] bg-[rgba(235,93,52,.92)] px-5 py-3 text-sm font-medium text-white shadow-[0_14px_26px_rgba(235,93,52,.24)] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-75"
        >
          <RotateCcw className="h-4 w-4" />
          {busy ? "Clearing your data..." : "Delete everything and start over"}
        </button>
        <p className="text-xs leading-5 text-[color:var(--muted)]">
          Use this only if you want a clean restart for this connected email.
        </p>
      </div>

      {error ? (
        <p className="mt-4 text-sm leading-6 text-[color:var(--accent-strong)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
