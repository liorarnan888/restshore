import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { brandName } from "@/lib/brand";

export const metadata: Metadata = {
  title: `What Is CBT-I? | ${brandName}`,
  description:
    `A plain-language introduction to CBT-I, what it focuses on, and how ${brandName} turns those ideas into a calmer six-week beta experience.`,
};

export default function WhatIsCbtiPage() {
  return (
    <ContentPageShell
      eyebrow="CBT-I"
      title="What CBT-I is, in plain language"
      lede="CBT-I stands for cognitive behavioral therapy for insomnia. In practice, it usually means changing sleep timing, lowering bedtime effort, and teaching the brain more stable sleep cues over time."
      route="/what-is-cbti"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">The short version</h2>
        <p className="mt-3">
          CBT-I is less about chasing the perfect trick and more about changing the patterns that
          keep insomnia alive. That often includes a stable wake time, a clearer sleep window,
          better bed-sleep association, and calmer responses to rough nights.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Why it is taken seriously</h2>
        <p className="mt-3">
          CBT-I is widely used as a structured behavioral approach for insomnia. People often run
          into trouble when they keep trying to solve sleep with more effort, more time in bed, or
          more last-minute fixes. CBT-I works by changing the pattern underneath that struggle.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Why people find it helpful</h2>
        <p className="mt-3">
          Many sleep struggles get amplified by understandable coping moves: going to bed earlier,
          staying in bed longer, checking the clock, or trying harder and harder to sleep. CBT-I
          tries to reverse that loop.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How {brandName} uses the idea</h2>
        <p className="mt-3">
          {brandName} is a CBT-I inspired beta. It uses a guided intake, a six-week plan, a
          shareable sleep summary, calendar guidance, and morning logs to turn those principles
          into something easier to follow day to day.
        </p>
      </section>
    </ContentPageShell>
  );
}
