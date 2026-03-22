import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { brandName } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Trouble Falling Asleep | ${brandName}`,
  description:
    `A calmer look at why falling asleep can feel hard and how ${brandName} approaches bedtime effort, wake anchors, and sleep-window structure.`,
};

export default function TroubleFallingAsleepPage() {
  return (
    <ContentPageShell
      eyebrow="Falling Asleep"
      title="When falling asleep feels like work"
      lede="Trouble falling asleep often gets worse when bedtime becomes a performance test. The more the night feels high stakes, the harder it becomes to let sleep happen."
      route="/trouble-falling-asleep"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Common patterns</h2>
        <p className="mt-3">
          People often notice clock-watching, getting into bed too early, taking the phone into
          the rescue plan, or trying to force relaxation on command. Those moves are normal, but
          they can keep the nervous system alert.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What usually helps more</h2>
        <p className="mt-3">
          A protected sleep window, a steady wake anchor, a real wind-down, and softer responses
          to being awake tend to create better conditions than adding more pressure.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How {brandName} frames it</h2>
        <p className="mt-3">
          {brandName} does not try to promise instant sleep. It tries to give you a calmer
          structure around bedtime so the night stops feeling like a test you have to pass.
        </p>
      </section>
    </ContentPageShell>
  );
}
