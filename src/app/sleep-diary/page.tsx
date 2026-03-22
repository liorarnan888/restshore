import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { brandName } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Sleep Diary Guide | ${brandName}`,
  description:
    `Why a sleep diary matters, what to track, and how ${brandName} uses a morning log to keep future guidance tied to what actually happened.`,
};

export default function SleepDiaryPage() {
  return (
    <ContentPageShell
      eyebrow="Sleep Diary"
      title="Why a sleep diary helps"
      lede="A sleep diary does not have to be intense. The point is to capture a few repeatable signals so your sleep story is built from patterns, not from one rough night or a fuzzy memory."
      route="/sleep-diary"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What matters most</h2>
        <p className="mt-3">
          Useful sleep diaries usually track when you got into bed, when you got out of bed,
          whether sleep was slow or broken, and how functional you felt the next morning.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Why consistency beats detail overload</h2>
        <p className="mt-3">
          People often quit diaries when they feel too clinical or too time-consuming. A short
          morning log is usually better than a perfect system you stop using after three days.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">How {brandName} uses it</h2>
        <p className="mt-3">
          {brandName} adds one short morning sleep log after each night. The goal is to update
          future guidance only when repeated patterns show up, not to overreact to a single bad
          night.
        </p>
      </section>
    </ContentPageShell>
  );
}
