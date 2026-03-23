"use client";

import { useState } from "react";
import { LoaderCircle } from "lucide-react";
import { signIn } from "next-auth/react";

import { cn } from "@/lib/utils";

export function ContinueWithGoogleButton({
  className,
  label = "Continue with Google",
  redirectTo = "/continue",
  variant = "outline",
}: {
  className?: string;
  label?: string;
  redirectTo?: string;
  variant?: "outline" | "link";
}) {
  const [pending, setPending] = useState(false);

  const classes =
    variant === "link"
      ? "inline-flex items-center gap-2 text-sm font-medium text-[color:var(--foreground)] underline decoration-[rgba(31,35,64,.18)] decoration-1 underline-offset-4 transition hover:text-[color:var(--teal)]"
      : "inline-flex items-center justify-center gap-2 rounded-full border border-[rgba(31,35,64,.16)] bg-white/90 px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] shadow-[0_10px_24px_rgba(31,35,64,0.08)] transition hover:-translate-y-0.5";

  return (
    <button
      type="button"
      className={cn(classes, className)}
      onClick={() => {
        setPending(true);

        void signIn(
          "google",
          {
            redirectTo,
          },
          {
            scope: "openid email profile",
          },
        ).finally(() => {
          setPending(false);
        });
      }}
    >
      {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
      {label}
    </button>
  );
}
