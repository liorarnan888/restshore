import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { brandName } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Wake Time Problems | ${brandName}`,
  description:
    `Why wake time matters, how drift affects nights, and how ${brandName} uses wake anchors and morning light to support a steadier rhythm.`,
};

export default function WakeTimeProblemsPage() {
  return (
    <ContentPageShell
      eyebrow="Wake Time"
      title="Why wake time matters more than most people expect"
      lede="When sleep is messy, the temptation is usually to focus on bedtime alone. But the morning often teaches the body clock more clearly than the evening does."
      route="/wake-time-problems"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What drift does</h2>
        <p className="mt-3">
          Sleeping in after a rough night can feel logical, but it often steals sleep pressure from
          the next night. Weekend drift can do the same thing quietly, even when weekdays look
          disciplined.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What anchors help</h2>
        <p className="mt-3">
          A stable rise time, getting out of bed promptly, and morning light exposure are simple
          signals that help the day-night rhythm stop guessing.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How {brandName} uses wake anchors</h2>
        <p className="mt-3">
          Every {brandName} plan is built around a wake anchor first. The rest of the rhythm,
          including bedtime, wind-down timing, and recovery after rough nights, works outward from
          that anchor.
        </p>
      </section>
    </ContentPageShell>
  );
}
