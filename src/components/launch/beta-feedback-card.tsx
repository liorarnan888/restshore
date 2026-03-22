"use client";

import { useMemo, useState } from "react";
import { LoaderCircle, MessageSquareHeart, Send } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";

import { betaFeedbackMessage } from "@/lib/brand";
import { getOrCreateLaunchVisitorId } from "@/lib/launch-client";
import type { LaunchFeedbackSource } from "@/lib/types";
import { cn } from "@/lib/utils";

type RequestState = "idle" | "saving" | "saved" | "error";

const ratingOptions = [
  { value: 1, label: "Off", detail: "Missed the mark" },
  { value: 2, label: "Rough", detail: "Too confusing or heavy" },
  { value: 3, label: "Mixed", detail: "Some value, some friction" },
  { value: 4, label: "Helpful", detail: "Useful and calming" },
  { value: 5, label: "Strong", detail: "I would keep using this" },
];

export function BetaFeedbackCard({
  source,
  sessionId,
  email,
  title = "Shape the beta",
  description = betaFeedbackMessage,
  className,
}: {
  source: LaunchFeedbackSource;
  sessionId?: string;
  email?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [rating, setRating] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [requestState, setRequestState] = useState<RequestState>("idle");
  const [error, setError] = useState<string | null>(null);
  const route = useMemo(
    () => `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`,
    [pathname, searchParams],
  );

  async function handleSubmit() {
    if (!rating) {
      setError("Pick a quick rating so we can calibrate the beta.");
      return;
    }

    setRequestState("saving");
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source,
          rating,
          message: message.trim() || undefined,
          sessionId,
          email: email || undefined,
          visitorId: getOrCreateLaunchVisitorId(),
          route,
        }),
      });

      if (!response.ok) {
        throw new Error("Unable to save feedback");
      }

      setRequestState("saved");
      setMessage("");
    } catch {
      setRequestState("error");
      setError("We could not save your feedback yet. Please try once more.");
    }
  }

  if (requestState === "saved") {
    return (
      <section
        className={cn(
          "glass-panel editorial-card rounded-[32px] border border-white/75 p-6",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)] text-[color:var(--teal)]">
            <MessageSquareHeart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="display text-3xl text-[color:var(--foreground)]">
              Thank you
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
              We saved your note and will use it to sharpen the next beta pass.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        "glass-panel editorial-card rounded-[32px] border border-white/75 p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(45,141,143,.12)] text-[color:var(--teal)]">
          <MessageSquareHeart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="display text-3xl text-[color:var(--foreground)]">
            {title}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--muted)]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-2 sm:grid-cols-5">
        {ratingOptions.map((option) => {
          const selected = rating === option.value;

          return (
            <button
              key={option.value}
              type="button"
              className={cn(
                "panel-lift rounded-[22px] border px-3 py-3 text-left transition",
                selected
                  ? "border-[color:var(--accent)] bg-[linear-gradient(135deg,rgba(245,127,91,.14),rgba(246,198,103,.16))]"
                  : "border-[color:var(--line)] bg-white/90 hover:border-[rgba(45,141,143,.36)] hover:bg-[rgba(45,141,143,.04)]",
              )}
              onClick={() => setRating(option.value)}
            >
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                {option.label}
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">
                {option.detail}
              </p>
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase tracking-[0.16em] text-[color:var(--muted)]">
          Anything you want us to know
        </span>
        <textarea
          className="mt-2 min-h-[132px] w-full rounded-[24px] border border-[color:var(--line)] bg-white/92 px-4 py-3 text-sm leading-6 text-[color:var(--foreground)] outline-none transition focus:border-[rgba(45,141,143,.36)]"
          placeholder="What felt especially useful, unclear, too much, or missing?"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
        />
      </label>

      {error ? (
        <p className="mt-3 rounded-2xl border border-[rgba(235,93,52,.18)] bg-[rgba(245,127,91,.12)] px-4 py-3 text-sm text-[color:var(--foreground)]">
          {error}
        </p>
      ) : null}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-5 py-3 font-medium text-white transition",
            requestState === "saving"
              ? "bg-[rgba(31,35,64,.28)]"
              : "bg-[linear-gradient(90deg,var(--accent-strong),var(--accent))] shadow-[0_18px_32px_rgba(235,93,52,.24)] hover:-translate-y-0.5",
          )}
          disabled={requestState === "saving"}
          onClick={() => void handleSubmit()}
        >
          {requestState === "saving" ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Send beta feedback
        </button>
      </div>
    </section>
  );
}
