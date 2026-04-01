import Link from "next/link";

import { ContentPageShell } from "@/components/launch/content-page-shell";
import { guideIndexSections } from "@/lib/guide-content";
import { buildPageMetadata } from "@/lib/seo";

const readingPaths = [
  {
    title: "I want the big picture first",
    detail:
      "Start here if you want to understand the method before you think about your own nights.",
    links: [
      { label: "What CBT-I is, in plain language", href: "/what-is-cbti" },
      { label: "CBT-I vs sleep hygiene", href: "/guides/cbt-i-vs-sleep-hygiene" },
      { label: "How RestShore works", href: "/how-restshore-works" },
    ],
  },
  {
    title: "I cannot fall asleep",
    detail:
      "Use this path if bedtime itself feels loaded, pressured, or impossible to trust.",
    links: [
      { label: "When falling asleep feels like work", href: "/trouble-falling-asleep" },
      { label: "How to think about sleep anxiety at night", href: "/guides/sleep-anxiety-at-night" },
      { label: "Stimulus control for insomnia", href: "/guides/stimulus-control-for-insomnia" },
    ],
  },
  {
    title: "I wake too early or during the night",
    detail:
      "Start here if the back half of the night is the part that keeps breaking down.",
    links: [
      { label: "What to do when you keep waking up in the night", href: "/guides/waking-up-in-the-night" },
      { label: "What to do when you keep waking up too early", href: "/guides/waking-up-too-early" },
      { label: "Why wake time matters more than most people expect", href: "/wake-time-problems" },
    ],
  },
  {
    title: "I want a practical structure",
    detail:
      "This path is for people who already know enough and mostly need a more usable framework.",
    links: [
      { label: "Why a sleep diary helps", href: "/sleep-diary" },
      { label: "How to use a sleep diary", href: "/guides/how-to-use-a-sleep-diary" },
      { label: "How to build a sleep schedule", href: "/guides/how-to-build-a-sleep-schedule" },
    ],
  },
];

export const metadata = buildPageMetadata({
  title: "Sleep guides and insomnia education | RestShore",
  description:
    "Browse RestShore's educational sleep guides on CBT-I-informed structure, sleep diaries, wake anchors, fragmented sleep, and bedtime pressure.",
  path: "/guides",
});

export default function GuidesPage() {
  return (
    <ContentPageShell
      eyebrow="Knowledge Library"
      title="Practical sleep guides for people trying to understand insomnia"
      lede="These pages are meant to be useful on their own, not just SEO landing pages. Start where your question is most urgent, or move through the sequence if you want a steadier understanding of the whole pattern."
      route="/guides"
    >
      <section className="grid gap-4 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
        <div className="rounded-[28px] border border-[rgba(31,35,64,.08)] bg-[rgba(255,248,239,0.78)] px-5 py-5 sm:px-6">
          <h2 className="display text-3xl text-[color:var(--foreground)]">How to use this library</h2>
          <div className="mt-4 grid gap-4 text-sm leading-7 text-[color:var(--foreground)]">
            <p>Start with the foundations if you want the big picture around CBT-I-informed structure.</p>
            <p>Go to the pattern pages if your real question is about falling asleep, waking at night, early waking, or sleep anxiety.</p>
            <p>Open any guide, then use the previous and next links at the bottom to stay inside a calmer reading flow.</p>
          </div>
        </div>

        <div className="glass-panel editorial-card rounded-[30px] border border-white/75 px-5 py-5 sm:px-6">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[color:var(--teal)]">
            Suggested reading paths
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {readingPaths.map((path) => (
              <article
                key={path.title}
                className="rounded-[22px] border border-[rgba(31,35,64,.08)] bg-white/78 px-4 py-4"
              >
                <h3 className="display text-2xl leading-tight text-[color:var(--foreground)]">
                  {path.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">{path.detail}</p>
                <ol className="mt-4 grid gap-2">
                  {path.links.map((link, index) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 rounded-[16px] px-2 py-2 text-sm leading-6 text-[color:var(--foreground)] transition hover:bg-[rgba(255,248,239,0.7)]"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(45,141,143,.12)] text-[11px] font-medium uppercase tracking-[0.08em] text-[color:var(--teal)]">
                          {index + 1}
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
        </div>
      </section>

      {guideIndexSections.map((section) => (
        <section key={section.title} className="glass-panel editorial-card rounded-[30px] border border-white/75 px-5 py-5 sm:px-6">
          <div className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr] lg:gap-8">
            <div>
              <h2 className="display text-[2rem] leading-[1.02] text-[color:var(--foreground)]">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-[color:var(--muted)]">{section.description}</p>
            </div>

            <div className="grid gap-2">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between rounded-[18px] border border-[rgba(31,35,64,.08)] bg-white/78 px-4 py-4 text-sm font-medium leading-6 text-[color:var(--foreground)] transition hover:-translate-y-0.5 hover:bg-[rgba(255,248,239,0.82)]"
                >
                  <span>{link.label}</span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-[color:var(--muted)] transition group-hover:text-[color:var(--teal)]">
                    Read
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}
    </ContentPageShell>
  );
}
