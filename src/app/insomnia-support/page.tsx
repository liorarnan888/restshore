import type { Metadata } from "next";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { appSupportPromise, brandName } from "@/lib/brand";

export const metadata: Metadata = {
  title: `Insomnia Support | ${brandName}`,
  description:
    `A consumer-first overview of insomnia support, when structured coaching can help, and how ${brandName} fits into a non-medical beta workflow.`,
};

export default function InsomniaSupportPage() {
  return (
    <ContentPageShell
      eyebrow="Insomnia Support"
      title="A calmer way to think about insomnia support"
      lede="People looking for insomnia support are often tired, overloaded, and wary of one more product that overpromises. A useful starting point is structure, clarity, and less panic around each night."
      route="/insomnia-support"
    >
      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What support can look like</h2>
        <p className="mt-3">
          Support might mean learning your timing patterns, protecting a wake anchor, building a
          real wind-down, tracking repeated night patterns, or deciding when outside help makes
          sense.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">What this beta is trying to do</h2>
        <p className="mt-3">
          {brandName} is trying to make that structure feel calmer and more usable. The intake,
          sleep summary, calendar guidance, and morning log are designed to reduce confusion and
          help people follow a steadier rhythm over time.
        </p>
      </section>

      <section>
        <h2 className="display text-3xl text-[color:var(--foreground)]">Important framing</h2>
        <p className="mt-3">{appSupportPromise}</p>
      </section>
    </ContentPageShell>
  );
}
