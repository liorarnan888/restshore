"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RotateCcw } from "lucide-react";

import { brandName } from "@/lib/brand";

export function RetakeAssessmentButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="editorial-card rounded-[28px] border border-[color:var(--line)] p-6">
      <h2 className="display text-3xl text-[color:var(--foreground)]">
        Retake the assessment
      </h2>
      <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
        Start the interview again. When you finish, we will refresh the dedicated
        {brandName} calendar instead of adding another one.
      </p>
      <button
        className="panel-lift mt-5 inline-flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-white px-5 py-3 font-medium text-[color:var(--foreground)]"
        type="button"
        onClick={() => {
          setLoading(true);
          setError(null);

          startTransition(() => {
            void fetch("/api/intake/restart", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  throw new Error("Unable to restart assessment");
                }

                const payload = (await response.json()) as {
                  session: { resumeToken: string };
                };
                router.push(`/?resume=${payload.session.resumeToken}`);
              })
              .catch(() => {
                setError("We couldn't restart the assessment yet.");
              })
              .finally(() => {
                setLoading(false);
              });
          });
        }}
      >
        {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
        Start assessment again
      </button>
      {error ? (
        <p className="mt-3 text-sm text-[color:var(--accent-strong)]">{error}</p>
      ) : null}
    </div>
  );
}
